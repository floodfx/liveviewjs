import { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";
import {
  handleHttpLiveView,
  HttpRequestAdaptor,
  PageTitleDefaults,
  SerDe,
  SessionData,
  LiveViewRouter,
  LiveViewTemplate,
} from "liveviewjs";
import { NodeJwtSerDe } from "./jwtSerDe";

/**
 * Middleware for Express that determines if a request is for a LiveView
 * and if so, handles the request.  If not, it calls the next middleware.
 * @param getRouter a function to access the LiveViewRouter which is used to match the request path against
 * @param rootTemplateRenderer a function that embeds the LiveView HTML into to and forms a complete HTML page
 * @param signingSecret the secret used by the reuest adaptor to sign the session data
 * @param pageTitleDefaults (optional) a PageTitleDefaults object that is fed into the rootTemplateRenderer
 * @param liveViewTemplateRenderer (optional) another renderer that can sit between the root template and the rendered LiveView
 */
export const connectLiveViewJS = (
  router: LiveViewRouter,
  rootTemplateRenderer: (
    pageTitleDefault: PageTitleDefaults,
    csrfToken: string,
    content: LiveViewTemplate
  ) => LiveViewTemplate,
  signingSecret: string,
  pageTitleDefaults?: PageTitleDefaults,
  liveViewTemplateRenderer?: (session: SessionData, liveViewContent: LiveViewTemplate) => LiveViewTemplate
): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adaptor = new ExpressRequestAdaptor(req, res, signingSecret);
      const { getRequestPath } = adaptor;

      // look up LiveView for route
      const liveview = router[getRequestPath()];
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
        rootTemplateRenderer,
        pageTitleDefaults,
        liveViewTemplateRenderer
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
};

/**
 * Express specific adaptor for mapping HTTP requests to LiveViews
 */
class ExpressRequestAdaptor implements HttpRequestAdaptor {
  redirect: string | undefined;
  private req: Request;
  private res: Response;
  private signingSecret: string;
  constructor(req: Request, res: Response, signingSecret: string) {
    this.req = req;
    this.res = res;
    this.signingSecret = signingSecret;
  }

  getSessionData = (): SessionData => {
    // note: req.session is added by express-session middleware
    return this.req.session;
  };
  getRequestParameters = (): { [key: string]: any } => {
    return this.req.query;
  };
  getRequestUrl = (): string => {
    return this.req.url;
  };
  getRequestPath = (): string => {
    return this.req.path;
  };
  onRedirect = (to: string) => {
    this.redirect = to;
  };
  getSerDe = (): SerDe => {
    return new NodeJwtSerDe(this.signingSecret);
  };
}
