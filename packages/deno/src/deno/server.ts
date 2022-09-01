import { DenoJwtSerDe } from "../deno/jwtSerDe.ts";
import type {
  FlashAdaptor,
  HttpRequestAdaptor,
  LiveViewPageRenderer,
  LiveViewRootRenderer,
  LiveViewRouter,
  LiveViewServerAdaptor,
  PageTitleDefaults,
  PubSub,
  SerDe,
  SessionData,
} from "../deps.ts";
import { Context, handleHttpLiveView, nanoid, WsMessageRouter } from "../deps.ts";

export class DenoOakLiveViewServer
  implements
    LiveViewServerAdaptor<
      (ctx: Context<Record<string, any>, Record<string, any>>, next: () => Promise<unknown>) => Promise<void>
    >
{
  private router: LiveViewRouter;
  private serDe: SerDe;
  private flashAdapter: FlashAdaptor;
  private pubSub: PubSub;
  private pageRenderer: LiveViewPageRenderer;
  private pageTitleDefaults: PageTitleDefaults;
  private fileSystem: FileSystemAdaptor;
  private rootRenderer?: LiveViewRootRenderer;

  /**
   * @param router
   * @param serDe
   * @param pubSub
   * @param pageRenderer
   * @param pageTitleDefaults
   * @param flashAdaptor
   * @param rootRenderer (optional) another renderer that can sit between the root template and the rendered LiveView
   */
  constructor(
    router: LiveViewRouter,
    serDe: SerDe,
    pubSub: PubSub,
    pageRenderer: LiveViewPageRenderer,
    pageTitleDefaults: PageTitleDefaults,
    flashAdaptor: FlashAdaptor,
    fileSystem: FileSystemAdaptor,
    rootRenderer?: LiveViewRootRenderer
  ) {
    this.router = router;
    this.serDe = serDe;
    this.flashAdapter = flashAdaptor;
    this.pubSub = pubSub;
    this.fileSystem = fileSystem;
    this.pageRenderer = pageRenderer;
    this.pageTitleDefaults = pageTitleDefaults;
    this.rootRenderer = rootRenderer;
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
        const liveview = this.router[getRequestPath()];
        if (!liveview) {
          // no LiveView found for route so call next() to
          // let a possible downstream route handle the request
          await next();
          return;
        }

        // defer to liveviewjs to handle the request
        const rootViewHtml = await handleHttpLiveView(
          nanoid,
          nanoid,
          liveview,
          adaptor,
          this.pageRenderer,
          this.pageTitleDefaults,
          this.rootRenderer
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

  wsRouter() {
    return new WsMessageRouter(
      this.router,
      this.pubSub,
      this.flashAdapter,
      this.serDe,
      this.fileSystem,
      this.rootRenderer
    );
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
