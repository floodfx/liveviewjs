import {
  AnyLiveContext,
  HttpLiveComponentSocket,
  LiveComponent,
  LiveView,
  LiveViewHtmlPageTemplate,
  LiveViewTemplate,
  LiveViewWrapperTemplate,
  PathParams,
} from "../live";
import { SessionData } from "../session";
import { HttpLiveViewSocket } from "../socket/liveSocket";
import { html, safe } from "../templates";
import { LiveTitleOptions } from "../templates/helpers/live_title";
import { CsrfGenerator } from "./csrfGen";
import { IdGenerator } from "./idGen";
import { SerDe } from "./serDe";

/**
 * An interface that represents how to extract required data from an HTTP server request (such as Express, Koa, etc in the
 * Node ecosystem or Oak on the Deno ecosystem) for handling a LiveView http request.
 */
export interface HttpRequestAdaptor {
  /**
   * Make available SessionData from the HTTP request
   */
  getSessionData: () => SessionData;
  /**
   * Expose the HTTP request URL
   */
  getRequestUrl: () => URL;
  /**
   * Expose the path of the HTTP request URL
   */
  getRequestPath: () => string;
  /**
   * Callback to the adaptor that a redirect should be perfermed with the given url
   */
  onRedirect: (toUrl: string) => void;
  /**
   * Make available the SerDe for serializing and deserializing session data.
   */
  getSerDe: () => SerDe;
}

/**
 * Use the given inputs to handle (e.g. generate the HTML) for the requested LiveView. Usually this
 * is called via HTTP server middleware that determines if a request is to a LiveView and if so,
 * creates and passes all of the required inputs to this function
 * @param idGenerator the @{IdGenerator} to use to generate unique IDs for the HTTP request and web socket connection
 * @param csrfGenerator the @{CsrfGenerator} to use to generate unique CSRF tokens to protect against CSRF attacks
 * @param liveView the @{LiveView} to render
 * @param adaptor the @{HttpRequestAdaptor} to use to extract required data from the HTTP request
 * @param rootTemplateRenderer the @{LiveViewTemplate} which this @{LiveView} is rendered within (typically reused across all LiveViews)
 * @param pageTitleDefaults optional @{PageTitleDefaults} to use to set the page title for the LiveView
 * @param liveViewTemplateRenderer optional @{LiveViewTemplate} used for adding additional content to the LiveView (typically reused across all LiveViews)
 * @returns the HTML for the HTTP server to return to the client
 */
export const handleHttpLiveView = async (
  idGenerator: IdGenerator,
  csrfGenerator: CsrfGenerator,
  liveView: LiveView,
  adaptor: HttpRequestAdaptor,
  pageRenderer: LiveViewHtmlPageTemplate,
  pathParams: PathParams,
  pageTitleDefaults?: LiveTitleOptions,
  rootRenderer?: LiveViewWrapperTemplate
) => {
  const { getSessionData, getRequestUrl, onRedirect } = adaptor;
  // new LiveViewId for each request
  const liveViewId = idGenerator();

  // extract csrf token from session data or generate it if it doesn't exist
  const sessionData = getSessionData();
  if (sessionData._csrf_token === undefined) {
    sessionData._csrf_token = csrfGenerator();
  }

  // prepare a http socket for the `LiveView` render lifecycle: mount => handleParams => render
  const liveViewSocket = new HttpLiveViewSocket<AnyLiveContext>(liveViewId, getRequestUrl());

  // execute the `LiveView`'s `mount` function, passing in the data from the HTTP request
  await liveView.mount(
    liveViewSocket,
    { ...sessionData },
    { _csrf_token: sessionData._csrf_token, _mounts: -1, ...pathParams }
  );

  // check for redirects in `mount`
  if (liveViewSocket.redirect) {
    const { to } = liveViewSocket.redirect;
    onRedirect(to);
    return;
  }

  // execute the `LiveView`'s `handleParams` function, passing in the data from the HTTP request
  const url = getRequestUrl();
  await liveView.handleParams(url, liveViewSocket);

  // check for redirects in `handleParams`
  if (liveViewSocket.redirect) {
    const { to } = liveViewSocket.redirect;
    onRedirect(to);
    return;
  }

  // now render the `LiveView` including running the lifecycle of any `LiveComponent`s it contains
  let myself = 1; // counter for live_component calls
  const view = await liveView.render(liveViewSocket.context, {
    csrfToken: sessionData.csrfToken,
    async live_component(
      liveComponent: LiveComponent,
      params?: Partial<unknown & { id: string | number }>
    ): Promise<LiveViewTemplate> {
      // params may be empty if the `LiveComponent` doesn't have any params
      params = params ?? {};
      delete params.id; // remove id before passing to socket

      // prepare a http socket for the `LiveComponent` render lifecycle: mount => update => render
      const lcSocket = new HttpLiveComponentSocket(liveViewId, params);

      // pass params provided in `LiveView.render` to the `LiveComponent` socket
      lcSocket.assign(params);

      // start the `LiveComponent` lifecycle
      await liveComponent.mount(lcSocket);
      await liveComponent.update(lcSocket);

      // render view with context
      const newView = await liveComponent.render(lcSocket.context, { myself: myself });
      myself++;
      // return the view to the parent `LiveView` to be rendered
      return newView;
    },
    url,
    uploads: liveViewSocket.uploadConfigs,
  });

  // now that we've rendered the `LiveView` and its `LiveComponent`s, we can serialize the session data
  // to be passed into the websocket connection
  const serDe = adaptor.getSerDe();
  const serializedSession = await serDe.serialize({ ...sessionData });

  // TODO implement tracking of statics
  // const serializedStatics = serDe.serialize({ ...view.statics });
  const serializedStatics = "";

  // optionally render the `LiveView` inside another template passing the session data
  // and the rendered `LiveView` to the template renderer
  let liveViewContent = safe(view);
  if (rootRenderer) {
    liveViewContent = await rootRenderer({ ...sessionData }, safe(view));
  }

  // wrap `LiveView` content inside the `phx-main` template along with the serialized
  // session data and the generated live view ID for the websocket connection
  const rootContent = html`
    <div
      data-phx-main="true"
      data-phx-session="${serializedSession}"
      data-phx-static="${serializedStatics}"
      id="phx-${liveViewId}">
      ${safe(liveViewContent)}
    </div>
  `;

  // finally render the `LiveView` root template passing any pageTitle data, the CSRF token,  and the rendered `LiveView`
  const rootView = await pageRenderer(pageTitleDefaults ?? { title: "" }, sessionData._csrf_token, rootContent);
  return rootView.toString();
};
