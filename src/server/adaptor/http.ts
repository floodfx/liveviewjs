import {
  HttpLiveComponentSocket,
  LiveComponent,
  LiveComponentContext,
  LiveView,
  LiveViewContext,
  LiveViewTemplate,
} from "../component";
import { SessionData } from "../session";
import { HttpLiveViewSocket } from "../socket/live_socket";
import { html, safe } from "../templates";
import { PageTitleDefaults } from "../templates/helpers/page_title";

export type IdGenerator = () => string;

export type CsrfGenerator = () => string;

export interface SerDe {
  serialize<T>(data: T): Promise<string>;
  deserialize<T>(data: string): Promise<T>;
}

export type GetSessionDataFunction = () => SessionData;
export type GetRequestParametersFunction = () => { [key: string]: any };
export type GetRequestUrl = () => string;
export type GetRequestPath = () => string;

export interface RequestAdaptor {
  getSessionData: GetSessionDataFunction;
  getRequestParameters: GetRequestParametersFunction;
  getRequestUrl: GetRequestUrl;
  getRequestPath: GetRequestPath;
  onRedirect: (to: string) => void;
  getSerDe: () => SerDe;
}

export const handleHttpLiveView = async (
  idGenerator: IdGenerator,
  csrfGenerator: CsrfGenerator,
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
  const liveViewId = idGenerator();

  // get session data from cookie
  const sessionData = getSessionData();
  if (sessionData._csrf_token === undefined) {
    sessionData._csrf_token = csrfGenerator();
  }

  // http  socket
  const liveViewSocket = new HttpLiveViewSocket<LiveViewContext>(liveViewId);

  // mount
  await liveView.mount({ _csrf_token: sessionData._csrf_token, _mounts: -1 }, { ...sessionData }, liveViewSocket);

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

  const serDe = adaptor.getSerDe();
  const serializedSession = await serDe.serialize({ ...sessionData });
  // TODO implement tracking of statics
  // const serializedStatics = serDe.serialize({ ...view.statics });
  const serializedStatics = "";

  let liveViewContent = safe(view);
  if (liveViewTemplateRenderer) {
    liveViewContent = liveViewTemplateRenderer({ ...sessionData }, safe(view));
  }

  // embed liveView content into phx-main div
  const rootContent = html`
    <div
      data-phx-main="true"
      data-phx-session="${serializedSession}"
      data-phx-static="${serializedStatics}"
      id="phx-${liveViewId}">
      ${safe(liveViewContent)}
    </div>
  `;

  // render the view with all the data
  const rootView = rootTemplateRenderer(pageTitleDefaults ?? { title: "" }, sessionData._csrf_token, rootContent);
  return rootView.toString();
};
