import { SessionData } from "express-session";
import { LiveComponent, LiveViewTemplate } from ".";
import { LiveViewSocket } from "../socket/live_socket";
import { HttpLiveComponentSocket, LiveComponentContext } from "./live_component";

/**
 * Contexts can only be objects with string keys.
 */
 export interface LiveViewContext {[key: string]: unknown}

/**
 * Paramter passed into the `mount` function of a LiveViewComponent.
 */
export interface LiveViewMountParams {
  /**
   * The cross site request forgery token from the `LiveView` html page.
   */
  ["_csrf_token"]: string
  /**
   * The number of mounts for this `LiveView` component.
   */
  ["_mounts"]: number
}

/**
 * Interface for `LiveView`s supporting the basic lifecycle of a `LiveView`.
 * The `Context` type is for defining the "shape" of the data / state that is
 * managed (updated, changed, etc) by the `LiveView`.
 * The `Params` type is for defining what URLSearchParams may be added to the
 * `LiveView` URL.
 */
export interface LiveView<Context extends LiveViewContext, Params> {

  /**
   * `mount` is both when the `LiveView` is rendered for the HTTP request
   * and upon the first time the `LiveView` is mounted (i.e. connected) via
   * the websocket.  This is where you should load data and set the initial
   * context of the `LiveView`.
   * @param params the `LiveViewMountParams` for this `LiveView`
   * @param session the `SessionData` for this session (i.e. the user)
   * @param socket the `LiveViewSocket` for this `LiveView`
   */
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>): void | Promise<void>;

  /**
   * `render` is where the user interface is defined and calculated based on
   * the `LiveView`'s context and meta.  This is called every lifecycle of the
   * `LiveView` - that is when internal or external events occur.
   * @param context the current state for this `LiveView`
   * @param meta the `LiveViewMeta` for this `LiveView`
   */
  render(context: Context, meta: LiveViewMeta): LiveViewTemplate | Promise<LiveViewTemplate>;

  /**
   * `handleParams` is called on initial joining of the `LiveView` as well as on
   * `pushPatch` and `livePatch` events.  This is where you should handle any context (i.e. state)
   * changes that are based on the `LiveView`'s URL parameters.
   * @param params
   * @param url
   * @param socket
   */
  handleParams(params: StringPropertyValues<Params>, url: string, socket: LiveViewSocket<Context>): void | Promise<void>;

}

/**
 * Interface to be implemented if a `LiveView` component wants to recieve events initiated
 * on the client (from `phx-click`, `phx-change`, `phx-submit`, etc).
 */
export interface LiveViewExternalEventListener<Context extends LiveViewContext, Event extends string, Params> {
  /**
   * Events initiated by the client (i.e. user interactions with the `LiveView`) will be
   * passed into this handler.  Internal state (i.e. context) will be updated based on the
   * return value of this handler.
   * @param event the (string) event to handle
   * @param params any parameters associated with the event
   * @param socket The `LiveViewSocket` for this `LiveView` component
   */
  handleEvent(event: Event, params: StringPropertyValues<Params>, socket: LiveViewSocket<Context>): void | Promise<void>;
}

/**
 * Interface to be implemented if a `LiveView` component will handle internal events.
 */
export interface LiveViewInternalEventListener<Context extends LiveViewContext, Event> {
  /**
   * Events initiated by the `LiveView` or `LiveComponent`s that are childern of this
   * `LiveView` will be passed into this handler.  The internal state (context) will
   * be updated based on the return value of this handler.
   * @param event The event to handle
   * @param socket The `LiveViewSocket` for the `LiveView` component
   */
  handleInfo(event: Event, socket: LiveViewSocket<Context>): void | Promise<void>;
}

/**
 * Type that transforms all the properties types to strings
 */
export type StringPropertyValues<Type> = { [Property in keyof Type]: string;};


/**
 * Meta data and helpers for `LiveView` components.
 */
export interface LiveViewMeta {
  /**
   * The cross site request forgery token from the `LiveView` html page which
   * should be used to validate form submissions.
   */
  csrfToken: string
  /**
   * A helper for loading `LiveComponent`s within a `LiveView`.
   */
  live_component: <Context extends LiveComponentContext>(liveComponent: LiveComponent<Context>, params?: Partial<Context & {id: number | string}>) => Promise<LiveViewTemplate>
}

export class HttpLiveViewMeta implements LiveViewMeta {
  /**
   * The cross site request forgery token from the `LiveView` html page which
   * should be used to validate form submissions.
   */
  csrfToken: string;

  private myself: number = 0
  private liveViewId: string;
  constructor(liveViewId: string , csrfToken: string) {
    this.csrfToken = csrfToken;
    this.liveViewId = liveViewId;
  }

  async live_component<Context extends LiveComponentContext>(liveComponent: LiveComponent<Context>, params?: Partial<Context & { id: string | number; }> | undefined): Promise<LiveViewTemplate>  {
    // params may be empty
    params = params ?? {};
    delete params.id; // remove id before passing to socket

    // create live component socket
    const lcSocket = new HttpLiveComponentSocket<Context>(this.liveViewId, params as any);

    // update socket with params
    lcSocket.assign(params);

    // run lifecycle
    await liveComponent.mount(lcSocket);
    await liveComponent.update(lcSocket);

    // render view with context
    const lcContext = lcSocket.context;
    const newView = await liveComponent.render(lcContext, {myself: this.myself});
    this.myself++;
    // since http request is stateless send back the LiveViewTemplate
    return newView;
  }


}

export class WsLiveViewMeta implements LiveViewMeta {
  /**
   * The cross site request forgery token from the `LiveView` html page which
   * should be used to validate form submissions.
   */
  csrfToken: string;

  private myself: number = 0
  private liveViewId: string;
  constructor(liveViewId: string , csrfToken: string) {
    this.csrfToken = csrfToken;
    this.liveViewId = liveViewId;
  }

  async live_component<Context extends LiveComponentContext>(liveComponent: LiveComponent<Context>, params?: Partial<Context & { id: string | number; }> | undefined): Promise<LiveViewTemplate>  {
    // params may be empty
    params = params ?? {};
    delete params.id; // remove id before passing to socket

    // create live component socket
    const lcSocket = new HttpLiveComponentSocket<Context>(this.liveViewId, params as any);

    // update socket with params
    lcSocket.assign(params);

    // run lifecycle
    await liveComponent.mount(lcSocket);
    await liveComponent.update(lcSocket);

    // render view with context
    const lcContext = lcSocket.context;
    const newView = await liveComponent.render(lcContext, {myself: this.myself});
    this.myself++;
    // since http request is stateless send back the LiveViewTemplate
    return newView;
  }


}

