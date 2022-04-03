import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
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
      const adaptor = new ExpressRequestAdaptor(req, res, signingSecret);
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
        nanoid,
        nanoid,
        liveview,
        adaptor,
        rootTemplateRenderer,
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

export class NodeSessionSerDe implements SerDe {
  private secretOrPrivateKey: string;
  constructor(secretOrPrivateKey: string) {
    this.secretOrPrivateKey = secretOrPrivateKey;
  }
  deserialize<T extends { [key: string]: any }>(data: string): Promise<T> {
    return Promise.resolve(jwt.verify(data, this.secretOrPrivateKey) as T);
  }

  serialize<T extends { [key: string]: any }>(data: T): Promise<string> {
    return Promise.resolve(jwt.sign(data as unknown as object, this.secretOrPrivateKey));
  }
}

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
    return new NodeSessionSerDe(this.signingSecret);
  };
}
