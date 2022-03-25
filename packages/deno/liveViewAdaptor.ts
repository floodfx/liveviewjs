import { handleHttpLiveView, RequestAdaptor, SessionData } from "./src/server/adaptor/index.ts";
import { LiveViewRouter, LiveViewTemplate } from "./src/server/component/types.ts";
import { PageTitleDefaults } from "./src/server/templates/helpers/page_title.ts";
import { RouterContext } from "https://deno.land/x/oak/mod.ts";

interface ParamsDictionary {
  [key: string]: string;
}

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
): ((ctx: RouterContext<string, ParamsDictionary, Record<string, any>>, next: () => Promise<unknown>) => Promise<void>) => {
  return async (ctx: RouterContext<string, ParamsDictionary, Record<string, any>>, next: () => Promise<unknown>) => {
    try {
      const adaptor = new DenoRequestAdaptor(ctx);
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
        ctx.response.redirect(adaptor.redirect);
        return;
      }

      ctx.response.body = rootViewHtml;
    } catch (error) {
      throw error;
    }
  };
};

class DenoRequestAdaptor implements RequestAdaptor {
  redirect: string | undefined;
  ctx: RouterContext<string, ParamsDictionary, Record<string, any>> ;
  constructor(ctx:RouterContext<string, ParamsDictionary, Record<string, any>>) {
    this.ctx = ctx;
  }

  getSessionData(): SessionData {
    return this.ctx.state.session;
  }
  getRequestParameters(): { [key: string]: any } {
    return this.ctx.request.body
  }
  getRequestUrl(): string {
    return this.ctx.request.url.toString();
  }
  getRequestPath(): string {
    return this.ctx.request.url.pathname;
  }
  onRedirect(to: string) {
    this.redirect = to;
  }
}
