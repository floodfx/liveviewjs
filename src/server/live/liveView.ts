import { LiveComponent, LiveViewTemplate } from ".";
import { SessionData } from "../session";
import { LiveViewSocket } from "../socket/liveSocket";

export interface LiveContext {
  [key: string]: any;
}

export interface AnyLiveContext extends LiveContext {
  [key: string]: any;
}

export interface LiveEvent {
  type: string;
}

export interface AnyLiveEvent extends LiveEvent {
  [key: string]: string;
}

export interface LiveInfo {
  type: string;
}

export interface AnyLiveInfo extends LiveInfo {
  [key: string]: any;
}

export interface AnyLivePushEvent extends LiveEvent {
  [key: string]: any;
}

/**
 * Paramter passed into the `mount` function of a LiveViewComponent.
 */
export interface LiveViewMountParams {
  /**
   * The cross site request forgery token from the `LiveView` html page.
   */
  ["_csrf_token"]: string;
  /**
   * The number of mounts for this `LiveView` component.
   */
  ["_mounts"]: number;
}

/**
 * Interface for `LiveView`s supporting the basic lifecycle of a `LiveView`.
 * The `Context` type is for defining the "shape" of the data / state that is
 * managed (updated, changed, etc) by the `LiveView`.
 * The `Params` type is for defining what URLSearchParams may be added to the
 * `LiveView` URL.
 */
export interface LiveView<
  TContext extends LiveContext = AnyLiveContext,
  TEvents extends LiveEvent = AnyLiveEvent,
  TInfos extends LiveInfo = AnyLiveInfo
> {
  /**
   * `mount` is both when the `LiveView` is rendered for the HTTP request
   * and upon the first time the `LiveView` is mounted (i.e. connected) via
   * the websocket.  This is where you should load data and set the initial
   * context of the `LiveView`.
   * @param params the `LiveViewMountParams` for this `LiveView`
   * @param session the `SessionData` for this session (i.e. the user)
   * @param socket the `LiveViewSocket` for this `LiveView`
   */
  mount(
    params: LiveViewMountParams,
    session: Partial<SessionData>,
    socket: LiveViewSocket<TContext>
  ): void | Promise<void>;

  /**
   * `render` is where the user interface is generated based on the `LiveView`'s
   * context and meta data.  This is called every lifecycle of the `LiveView`,
   * that is when internal or external events occur.
   * @param context the current state for this `LiveView`
   * @param meta the `LiveViewMeta` for this `LiveView`
   */
  render(context: TContext, meta: LiveViewMeta): LiveViewTemplate | Promise<LiveViewTemplate>;

  /**
   * `handleParams` is called on initial joining of the `LiveView` as well as on
   * `pushPatch` and `livePatch` events.  This is where you should handle any context (i.e. state)
   * changes that are based on the `LiveView`'s URL parameters.
   * @param params
   * @param url
   * @param socket
   */
  handleParams(url: URL, socket: LiveViewSocket<TContext>): void | Promise<void>;

  /**
   * Events initiated by the client (i.e. user interactions with the `LiveView` elements
   * that have the attributes `phx-click`, `phx-change`, `phx-submit`, etc) will be
   * passed into this handler.
   * @param event the (string) event to handle
   * @param params any parameters associated with the event
   * @param socket The `LiveViewSocket` for this `LiveView` component
   */
  handleEvent(event: TEvents, socket: LiveViewSocket<TContext>): void | Promise<void>;

  /**
   * Events initiated by the `LiveView` or `LiveComponent`s that are childern of this
   * `LiveView` are passed into this handler.
   * @param event The event to handle
   * @param socket The `LiveViewSocket` for the `LiveView` component
   */
  handleInfo(info: TInfos, socket: LiveViewSocket<TContext>): void | Promise<void>;
}

/**
 * Meta data and helpers for `LiveView` components.
 */
export interface LiveViewMeta {
  /**
   * The cross site request forgery token from the `LiveView` html page which
   * should be used to validate form submissions.
   */
  csrfToken: string;
  /**
   * A helper for loading `LiveComponent`s within a `LiveView`.
   */
  live_component<Context extends LiveContext>(
    liveComponent: LiveComponent<Context>,
    params?: Partial<Context & { id: string | number }>
  ): Promise<LiveViewTemplate>;
}

/**
 * Abstract `LiveView` class that is easy to extend for any `LiveView`
 */
export abstract class BaseLiveView<
  TContext extends LiveContext = AnyLiveContext,
  TEvents extends LiveEvent = AnyLiveEvent,
  TInfos extends LiveInfo = AnyLiveInfo
> implements LiveView<TContext, TEvents, TInfos>
{
  handleEvent(event: TEvents, socket: LiveViewSocket<TContext>) {
    // istanbul ignore next
    console.warn(`onEvent not implemented for ${this.constructor.name} but event received: ${JSON.stringify(event)}`);
  }

  handleInfo(info: TInfos, socket: LiveViewSocket<TContext>) {
    // istanbul ignore next
    console.warn(`onInfo not implemented for ${this.constructor.name} but info received: ${JSON.stringify(info)}`);
  }

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<TContext>) {
    // no-op
  }

  handleParams(url: URL, socket: LiveViewSocket<TContext>) {
    // no-op
  }

  abstract render(context: TContext, meta: LiveViewMeta): LiveViewTemplate | Promise<LiveViewTemplate>;
}
