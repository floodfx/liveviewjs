import { NextFunction, Request, Response } from "express";
import { handleHttpLiveView, RequestAdaptor, SessionData } from ".";
import { LiveViewRouter, LiveViewTemplate } from "../component";
import { PageTitleDefaults } from "../live_view_server";

export const configLiveViewHandler = (
  getRouter: () => LiveViewRouter,
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
      const adaptor = new ExpressRequestAdaptor(req, res);
      const { getRequestPath } = adaptor;

      // look up component for route
      const liveview = getRouter()[getRequestPath()];
      if (!liveview) {
        // no component found for route so call next() to
        // let a possible downstream route handle the request
        next();
        return;
      }

      const rootViewHtml = await handleHttpLiveView(
        liveview,
        adaptor,
        rootTemplateRenderer,
        signingSecret,
        pageTitleDefaults,
        liveViewTemplateRenderer
      );

      if (adaptor.redirect) {
        res.redirect(adaptor.redirect);
        return;
      }

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

class ExpressRequestAdaptor implements RequestAdaptor {
  redirect: string | undefined;
  req: Request;
  res: Response;
  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
  }

  getSessionData(): SessionData {
    return this.req.session;
  }
  getRequestParameters(): { [key: string]: any } {
    return this.req.query;
  }
  getRequestUrl(): string {
    return this.req.url;
  }
  getRequestPath(): string {
    return this.req.path;
  }
  onRedirect(to: string) {
    this.redirect = to;
  }
}
