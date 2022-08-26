import { NextFunction, Request, RequestHandler, Response } from "express";
import {
  FileSystemAdaptor,
  FlashAdaptor,
  handleHttpLiveView,
  HttpRequestAdaptor,
  LiveViewPageRenderer,
  LiveViewRootRenderer,
  LiveViewRouter,
  LiveViewServerAdaptor,
  PageTitleDefaults,
  PubSub,
  SerDe,
  SessionData,
  WsMessageRouter,
} from "liveviewjs";
import { nanoid } from "nanoid";

export class NodeExpressLiveViewServer implements LiveViewServerAdaptor<RequestHandler> {
  private router: LiveViewRouter;
  private serDe: SerDe;
  private flashAdapter: FlashAdaptor;
  private pubSub: PubSub;
  private fileSystem: FileSystemAdaptor;
  private pageRenderer: LiveViewPageRenderer;
  private pageTitleDefaults: PageTitleDefaults;
  private rootRenderer?: LiveViewRootRenderer;

  /**
   * Middleware for Express that determines if a request is for a LiveView
   * and if so, handles the request.  If not, it calls the next middleware.
   * @param router a function to access the LiveViewRouter which is used to match the request path against
   * @param serDe a function that embeds the LiveView HTML into to and forms a complete HTML page
   * @param pubSub the secret used by the reuest adaptor to sign the session data
   * @param pageRenderer the secret used by the reuest adaptor to sign the session data
   * @param pageTitleDefaults (optional) a PageTitleDefaults object that is fed into the rootTemplateRenderer
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
    fileSystemAdaptor: FileSystemAdaptor,
    rootRenderer?: LiveViewRootRenderer
  ) {
    this.router = router;
    this.serDe = serDe;
    this.flashAdapter = flashAdaptor;
    this.pubSub = pubSub;
    this.fileSystem = fileSystemAdaptor;
    this.pageRenderer = pageRenderer;
    this.pageTitleDefaults = pageTitleDefaults;
    this.rootRenderer = rootRenderer;
  }

  httpMiddleware(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const adaptor = new ExpressRequestAdaptor(req, res, this.serDe);
        const { getRequestPath } = adaptor;

        // look up LiveView for route
        const liveview = this.router[getRequestPath()];
        if (!liveview) {
          // no LiveView found for route so call next() to
          // let a possible downstream route handle the request
          next();
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
