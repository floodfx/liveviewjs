import { NextFunction, Request, RequestHandler, Response } from "express";
import {
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
  PubSub,
  SerDe,
  SessionData,
  SessionFlashAdaptor,
  SingleProcessPubSub,
  WsMessageRouter,
} from "liveviewjs";
import { nanoid } from "nanoid";
import { WebSocketServer } from "ws";
import { NodeFileSystemAdatptor as NodeFileSystemAdaptor } from "./fsAdaptor";
import { NodeJwtSerDe } from "./jwtSerDe";
import { NodeWsAdaptor } from "./wsAdaptor";

interface NodeExpressLiveViewServerOptions {
  serDe?: SerDe;
  serDeSigningSecret?: string;
  pubSub?: PubSub;
  flashAdaptor?: FlashAdaptor;
  fileSystemAdaptor?: FileSystemAdaptor;
  wrapperTemplate?: LiveViewWrapperTemplate;
}

export class NodeExpressLiveViewServer
  implements LiveViewServerAdaptor<RequestHandler, (wsServer: WebSocketServer) => Promise<void>>
{
  private router: LiveViewRouter;
  private serDe: SerDe;
  private flashAdapter: FlashAdaptor;
  private pubSub: PubSub;
  private fileSystem: FileSystemAdaptor;
  private htmlPageTemplate: LiveViewHtmlPageTemplate;
  private liveTitleOptions: LiveTitleOptions;
  private wrapperTemplate?: LiveViewWrapperTemplate;
  private _wsRouter: WsMessageRouter;

  constructor(
    router: LiveViewRouter,
    htmlPageTemplate: LiveViewHtmlPageTemplate,
    liveTitleOptions: LiveTitleOptions,
    options?: NodeExpressLiveViewServerOptions
  ) {
    this.router = router;
    this.serDe = options?.serDe ?? new NodeJwtSerDe(options?.serDeSigningSecret ?? nanoid());
    this.flashAdapter = options?.flashAdaptor ?? new SessionFlashAdaptor();
    this.pubSub = options?.pubSub ?? new SingleProcessPubSub();
    this.fileSystem = options?.fileSystemAdaptor ?? new NodeFileSystemAdaptor();
    this.htmlPageTemplate = htmlPageTemplate;
    this.liveTitleOptions = liveTitleOptions;
    this.wrapperTemplate = options?.wrapperTemplate;
    this._wsRouter = new WsMessageRouter(
      this.router,
      this.pubSub,
      this.flashAdapter,
      this.serDe,
      this.fileSystem,
      this.wrapperTemplate
    );
  }

  wsMiddleware(): (wsServer: WebSocketServer) => Promise<void> {
    return async (wsServer: WebSocketServer) => {
      // send websocket requests to the LiveViewJS message router
      wsServer.on("connection", (ws) => {
        const connectionId = nanoid();
        ws.on("message", async (message, isBinary) => {
          // pass websocket messages to LiveViewJS
          await this._wsRouter.onMessage(connectionId, message, new NodeWsAdaptor(ws), isBinary);
        });
        ws.on("close", async () => {
          // pass websocket close events to LiveViewJS
          await this._wsRouter.onClose(connectionId);
        });
      });
    };
  }

  httpMiddleware(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const adaptor = new ExpressRequestAdaptor(req, res, this.serDe);
        const { getRequestPath } = adaptor;

        // look up LiveView for route
        const matchResult = matchRoute(this.router, getRequestPath());
        if (!matchResult) {
          // no LiveView found for route so call next() to
          // let a possible downstream route handle the request
          next();
          return;
        }
        const [liveview, mr] = matchResult;

        // defer to liveviewjs to handle the request
        const rootViewHtml = await handleHttpLiveView(
          nanoid,
          nanoid,
          liveview,
          adaptor,
          this.htmlPageTemplate,
          mr.params,
          this.liveTitleOptions,
          this.wrapperTemplate
        );

        // check if LiveView calls for a redirect and if so, do it
        if (adaptor.redirect) {
          res.redirect(adaptor.redirect);
          return;
        }

        // otherwise render the LiveView HTML
        res.format({
          html: () => {
            res.send(rootViewHtml);
          },
        });
      } catch (error) {
        next(error);
      }
    };
  }

  wsRouter() {
    return this._wsRouter;
  }
}

/**
 * Express specific adaptor for mapping HTTP requests to LiveViews
 */
class ExpressRequestAdaptor implements HttpRequestAdaptor {
  redirect: string | undefined;
  private req: Request;
  private res: Response;
  private serDe: SerDe;
  constructor(req: Request, res: Response, serDe: SerDe) {
    this.req = req;
    this.res = res;
    this.serDe = serDe;
  }

  getSessionData = (): SessionData => {
    // note: req.session is added by express-session middleware
    return this.req.session;
  };
  getRequestParameters = (): { [key: string]: any } => {
    return this.req.query;
  };
  getRequestUrl = (): URL => {
    // build the URL from the request
    var fullUrl = this.req.protocol + "://" + this.req.get("host") + this.req.originalUrl;
    return new URL(fullUrl);
  };
  getRequestPath = (): string => {
    return this.req.path;
  };
  onRedirect = (to: string) => {
    this.redirect = to;
  };
  getSerDe = (): SerDe => {
    return this.serDe;
  };
}
