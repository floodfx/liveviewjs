import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import {
  HttpLiveComponentSocket,
  LiveComponent,
  LiveComponentContext,
  LiveView,
  LiveViewContext,
  LiveViewTemplate,
} from "../component";
import { PageTitleDefaults } from "../live_view_server";
import { HttpLiveViewSocket } from "../socket/live_socket";
import { html, safe } from "../templates";
import { RequestAdaptor, SessionData } from "./express";

export const renderHttpLiveView = async (
  liveView: LiveView<LiveViewContext, unknown>,
  adaptor: RequestAdaptor,
  rootTemplateRenderer: (
    pageTitleDefault: PageTitleDefaults,
    csrfToken: string,
    content: LiveViewTemplate
  ) => LiveViewTemplate,
  signingSecret: string,
  pageTitleDefaults?: PageTitleDefaults,
  liveViewTemplateRenderer?: (session: SessionData, liveViewContent: LiveViewTemplate) => LiveViewTemplate
) => {
  const { getSessionData, getRequestParameters, getRequestUrl, onRedirect } = adaptor;
  // new LiveViewId for each request
  const liveViewId = nanoid();

  // get session data from cookie
  const sessionData = getSessionData();
  if (sessionData.csrfToken === undefined) {
    sessionData.csrfToken = nanoid();
  }

  // http  socket
  const liveViewSocket = new HttpLiveViewSocket<LiveViewContext>(liveViewId);

  // mount
  await liveView.mount({ _csrf_token: sessionData.csrfToken, _mounts: -1 }, { ...sessionData }, liveViewSocket);

  // check for redirects in mount
  if (liveViewSocket.redirect) {
    const { to } = liveViewSocket.redirect;
    onRedirect(to);
    return;
  }

  // handle_params
  await liveView.handleParams(getRequestParameters(), getRequestUrl(), liveViewSocket);

  // check for redirects in handle params
  if (liveViewSocket.redirect) {
    const { to } = liveViewSocket.redirect;
    onRedirect(to);
    return;
  }

  let myself = 1; // counter for live_component calls
  const view = await liveView.render(liveViewSocket.context, {
    csrfToken: sessionData.csrfToken,
    async live_component(
      liveComponent: LiveComponent<LiveComponentContext>,
      params?: Partial<LiveComponentContext & { id: string | number }>
    ): Promise<LiveViewTemplate> {
      // params may be empty
      params = params ?? {};
      delete params.id; // remove id before passing to socket

      // create live component socket
      const lcSocket = new HttpLiveComponentSocket<LiveComponentContext>(
        liveViewId,
        params as unknown as LiveComponentContext
      );

      // update socket with params
      lcSocket.assign(params);

      // run lifecycle
      await liveComponent.mount(lcSocket);
      await liveComponent.update(lcSocket);

      // render view with context
      const newView = await liveComponent.render(lcSocket.context, { myself: myself });
      myself++;
      // since http request is stateless send back the LiveViewTemplate
      return newView;
    },
  });

  const sessionJwt = jwt.sign({ ...sessionData }, signingSecret);
  const staticsJwt = jwt.sign(JSON.stringify(view.statics), signingSecret);

  let liveViewContent = safe(view);
  if (liveViewTemplateRenderer) {
    liveViewContent = liveViewTemplateRenderer({ ...sessionData }, safe(view));
  }

  // embed liveView content into phx-main div
  const rootContent = html`
    <div data-phx-main="true" data-phx-session="${sessionJwt}" data-phx-static="${staticsJwt}" id="phx-${liveViewId}">
      ${safe(liveViewContent)}
    </div>
  `;

  // render the view with all the data
  const rootView = rootTemplateRenderer(pageTitleDefaults ?? { title: "" }, sessionData.csrfToken, rootContent);
  return rootView.toString();
};
