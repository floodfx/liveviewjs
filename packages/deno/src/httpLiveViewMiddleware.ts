import type {
  HttpRequestAdaptor,
  LiveViewRouter,
  LiveViewTemplate,
  PageTitleDefaults,
  SerDe,
  SessionData,
} from "./deps.ts";
import { Context, handleHttpLiveView, nanoid } from "./deps.ts";
import { DenoJwtSerDe } from "./jwtSerDe.ts";

/**
 * Middleware for Oak that determines if a request is for a LiveView
 * and if so, handles the request.  If not, it calls the next middleware.
 * @param getRouter a function to access the LiveViewRouter which is used to match the request path against
 * @param rootTemplateRenderer a function that embeds the LiveView HTML into to and forms a complete HTML page
 * @param pageTitleDefaults (optional) a PageTitleDefaults object that is fed into the rootTemplateRenderer
 * @param liveViewTemplateRenderer (optional) another renderer that can sit between the root template and the rendered LiveView
 */
export const connectLiveViewJS = (
  router: LiveViewRouter,
  rootTemplateRenderer: (
    pageTitleDefault: PageTitleDefaults,
    csrfToken: string,
    content: LiveViewTemplate,
  ) => LiveViewTemplate,
  pageTitleDefaults?: PageTitleDefaults,
  liveViewTemplateRenderer?: (
    session: SessionData,
    liveViewContent: LiveViewTemplate,
  ) => LiveViewTemplate,
): ((
  ctx: Context<Record<string, any>, Record<string, any>>,
  next: () => Promise<unknown>,
) => Promise<void>) => {
  return async (
    ctx: Context<Record<string, any>, Record<string, any>>,
    next: () => Promise<unknown>,
  ) => {
    try {
      const adaptor = new DenoRequestAdaptor(ctx);
      const { getRequestPath } = adaptor;

      // look up LiveView for route
      const liveview = router[getRequestPath()];
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
        rootTemplateRenderer,
        pageTitleDefaults,
        liveViewTemplateRenderer,
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
};

class DenoRequestAdaptor implements HttpRequestAdaptor {
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
  getRequestUrl = (): string => {
    return this.ctx.request.url.toString();
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
