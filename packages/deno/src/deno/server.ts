import { DenoJwtSerDe } from "../deno/jwtSerDe.ts";
import {
  Context,
  FileSystemAdaptor,
  FlashAdaptor,
  handleHttpLiveView,
  HttpRequestAdaptor,
  LiveTitleOptions,
  LiveViewHtmlPageTemplate,
  LiveViewRouter,
  LiveViewServerAdaptor,
  LiveViewWrapperTemplate,
  matchRoute,
  nanoid,
  PubSub,
  SerDe,
  SessionData,
  SessionFlashAdaptor,
  SingleProcessPubSub,
  WsHandler,
  WsHandlerConfig,
  WsMessageRouter,
} from "../deps.ts";
import { DenoFileSystemAdaptor } from "./fsAdaptor.ts";
import { DenoWsAdaptor } from "./wsAdaptor.ts";

interface DenoOakLiveViewServerOptions {
  serDe?: SerDe;
  pubSub?: PubSub;
  flashAdaptor?: FlashAdaptor;
  fileSystemAdaptor?: FileSystemAdaptor;
  wrapperTemplate?: LiveViewWrapperTemplate;
  onError?: (err: any) => void;
}

type DenoMiddleware = (
  ctx: Context<Record<string, any>, Record<string, any>>,
  next: () => Promise<unknown>
) => Promise<void>;

export class DenoOakLiveViewServer implements LiveViewServerAdaptor<DenoMiddleware, DenoMiddleware> {
  private router: LiveViewRouter;
  private serDe: SerDe;
  private flashAdapter: FlashAdaptor;
  private pubSub: PubSub;
  private liveHtmlTemplate: LiveViewHtmlPageTemplate;
  private liveTitleOptions: LiveTitleOptions;
  private fileSystem: FileSystemAdaptor;
  private wrapperTemplate?: LiveViewWrapperTemplate;
  private _wsRouter: WsMessageRouter;
  #config: WsHandlerConfig;

  /**
   * @param router
   * @param serDe
   * @param pubSub
   * @param liveHtmlTemplate
   * @param liveTitleDefaults
   * @param flashAdaptor
   * @param rootRenderer (optional) another renderer that can sit between the root template and the rendered LiveView
   */
  constructor(
    router: LiveViewRouter,
    liveHtmlTemplate: LiveViewHtmlPageTemplate,
    liveTitleDefaults: LiveTitleOptions,
    options?: DenoOakLiveViewServerOptions
  ) {
    this.router = router;
    this.serDe = options?.serDe ?? new DenoJwtSerDe();
    this.flashAdapter = options?.flashAdaptor ?? new SessionFlashAdaptor();
    this.pubSub = options?.pubSub ?? new SingleProcessPubSub();
    this.fileSystem = options?.fileSystemAdaptor ?? new DenoFileSystemAdaptor();
    this.liveHtmlTemplate = liveHtmlTemplate;
    this.liveTitleOptions = liveTitleDefaults;
    this.wrapperTemplate = options?.wrapperTemplate;
    this._wsRouter = new WsMessageRouter(
      this.router,
      this.pubSub,
      this.flashAdapter,
      this.serDe,
      this.fileSystem,
      this.wrapperTemplate
    );
    this.#config = {
      router: this.router,
      fileSysAdaptor: this.fileSystem,
      serDe: this.serDe,
      wrapperTemplate: this.wrapperTemplate,
      flashAdaptor: this.flashAdapter,
      pubSub: this.pubSub,
      onError: options?.onError,
    };
  }

  wsMiddleware(): (ctx: Context<Record<string, any>, Record<string, any>>) => Promise<void> {
    return async (ctx: Context<Record<string, any>, Record<string, any>>) => {
      // upgrade the request to a websocket connection
      const ws = await ctx.upgrade();
      // const connectionId = nanoid();
      new WsHandler(new DenoWsAdaptor(ws), this.#config);
    };
  }

  httpMiddleware(): (
    ctx: Context<Record<string, any>, Record<string, any>>,
    next: () => Promise<unknown>
  ) => Promise<void> {
    return async (ctx: Context<Record<string, any>, Record<string, any>>, next: () => Promise<unknown>) => {
      try {
        const adaptor = new OakContextAdaptor(ctx);
        const { getRequestPath } = adaptor;

        // look up LiveView for route
        const matchResult = matchRoute(this.router, getRequestPath());
        if (!matchResult) {
          // no LiveView found for route so call next() to
          // let a possible downstream route handle the request
          await next();
          return;
        }
        const [liveview, mr] = matchResult;

        // defer to liveviewjs to handle the request
        const rootViewHtml = await handleHttpLiveView(
          nanoid,
          nanoid,
          liveview,
          adaptor,
          this.liveHtmlTemplate,
          mr.params,
          this.liveTitleOptions,
          this.wrapperTemplate
        );

        // check if LiveView calls for a redirect and if so, do it
        if (adaptor.redirect) {
          ctx.response.redirect(adaptor.redirect);
          return;
        }

        // otherwise render the LiveView HTML
        ctx.response.body = rootViewHtml ? rootViewHtml.toString() : "";
        ctx.response.type = "text/html";
        await next();
      } catch (error) {
        throw error;
      }
    };
  }
}

class OakContextAdaptor implements HttpRequestAdaptor {
  public redirect: string | undefined;
  private ctx: Context<Record<string, any>, Record<string, any>>;
  constructor(ctx: Context<Record<string, any>, Record<string, any>>) {
    this.ctx = ctx;
  }

  getSessionData = (): SessionData => {
    return this.ctx.state.session ?? {};
  };
  getRequestParameters = (): { [key: string]: any } => {
    return this.ctx.request.body;
  };
  getRequestUrl = (): URL => {
    return this.ctx.request.url;
  };
  getRequestPath = (): string => {
    return this.ctx.request.url.pathname;
  };
  onRedirect = (to: string) => {
    this.redirect = to;
  };
  getSerDe = (): SerDe => {
    return new DenoJwtSerDe();
  };
}
