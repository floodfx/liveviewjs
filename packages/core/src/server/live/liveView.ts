import { LiveComponent, LiveViewTemplate } from ".";
import { SessionData } from "../session";
import { LiveViewSocket } from "../socket/liveSocket";
import { LiveTitleOptions } from "../templates";
import { UploadConfig } from "../upload/uploadConfig";

/**
 * LiveContext sets the minimum requirements for a `LiveView` context.
 */
export interface LiveContext {
  [key: string]: any;
}

/**
 * Generic LiveContext Type that can be used for any `LiveView` context.
 */
export interface AnyLiveContext extends LiveContext {
  [key: string]: any;
}

/**
 * LiveEvent is the minimal interface for a `LiveEvent` which requires a `type` field.
 */
export interface LiveEvent {
  type: string;
}

/**
 * Generic LiveEvent Type that can be used for any `LiveEvent`.
 */
export interface AnyLiveEvent extends LiveEvent {
  [key: string]: any;
}

/**
 * LiveInfo is the minimal interface for a `LiveInfo` which requires a `type` field.
 */
export interface LiveInfo {
  type: string;
}

/**
 * Generic LiveInfo Type that can be used for any `LiveInfo`.
 */
export interface AnyLiveInfo extends LiveInfo {
  [key: string]: any;
}

/**
 * AnyLivePushEvent is the minimal interface for events that can be pushed to the client.
 */
export interface AnyLivePushEvent extends LiveEvent {
  [key: string]: any;
}

/**
 * Paramter passed into the `mount` function of a LiveView.
 */
export type LiveViewMountParams = {
  [key: string]: string | number;
  /**
   * The cross site request forgery token from the `LiveView` html page.
   */
  ["_csrf_token"]: string;
  /**
   * The number of mounts for this `LiveView`.
   */
  ["_mounts"]: number;
};

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
   * `mount` is called both when the `LiveView` is rendered for the HTTP request
   * and upon the first time the `LiveView` is mounted (i.e. connected) via
   * the websocket.  This is where you should load data and set the initial
   * context of the `LiveView`.
   * @param socket the `LiveViewSocket` for this `LiveView`
   * @param session the `SessionData` for this session (i.e. the user)
   * @param params the `LiveViewMountParams` for this `LiveView`
   */
  mount(
    socket: LiveViewSocket<TContext, TInfos>,
    session: Partial<SessionData>,
    params: LiveViewMountParams
  ): void | Promise<void>;

  /**
   * `handleParams` is called on initial loading of the `LiveView` (one-time, after `mount`) as well as on
   * `pushPatch` and `livePatch` events.  This is where you should handle any context (i.e. state)
   * changes that are based on the `LiveView`'s URL parameters.
   * @param params
   * @param url
   * @param socket
   */
  handleParams(url: URL, socket: LiveViewSocket<TContext, TInfos>): void | Promise<void>;

  /**
   * Events initiated by the client (i.e. user interactions with the `LiveView` elements
   * that have the attributes `phx-click`, `phx-change`, `phx-submit`, etc) will be
   * passed into this handler.
   * @param event the (string) event to handle
   * @param socket The `LiveViewSocket` for this `LiveView`
   */
  handleEvent(event: TEvents, socket: LiveViewSocket<TContext, TInfos>): void | Promise<void>;

  /**
   * Internal events, i.e. "Info" initiated by the `LiveView` or `LiveComponent`s that are childern of this
   * `LiveView` are passed into this handler.
   * @param event The info to handle
   * @param socket The `LiveViewSocket` for the `LiveView`
   */
  handleInfo(info: TInfos, socket: LiveViewSocket<TContext, TInfos>): void | Promise<void>;

  /**
   * `render` is where the user interface is generated based on the `LiveView`'s
   * context and meta data.  This is called every lifecycle of the `LiveView`,
   * that is when internal or external events occur.
   * @param context the current state for this `LiveView`
   * @param meta the `LiveViewMeta` for this `LiveView`
   */
  render(context: TContext, meta: LiveViewMeta<TEvents>): LiveViewTemplate | Promise<LiveViewTemplate>;

  /**
   * `shutdown` is called when the `LiveView` is disconnected from the websocket. You can clean
   * up any resources or references here.
   */
  shutdown(id: string, content: TContext): void | Promise<void>;
}

/**
 * Meta data and helpers for `LiveView`s passed into the `render` function of a `LiveView`.
 * Provides readonly access to the `csrfToken`, `url`, and `uploads` for the `LiveView` along
 * with a helper for loading `LiveComponent`s within a `LiveView`.
 */
export interface LiveViewMeta<TEvents extends LiveEvent = AnyLiveEvent> {
  /**
   * The cross site request forgery token from the `LiveView` html page which
   * should be used to validate form submissions.
   */
  readonly csrfToken: string;

  /**
   * The current url for this `LiveView`
   */
  readonly url: URL;
  /**
   * A helper for loading `LiveComponent`s within a `LiveView`.
   */
  live_component<TContext extends LiveContext = AnyLiveContext>(
    liveComponent: LiveComponent<TContext, any, any>,
    params?: Partial<TContext & { id: string | number }>
  ): Promise<LiveViewTemplate>;
  /**
   * Get UploadConfig details about given key
   */
  readonly uploads: { [key: string]: UploadConfig };

  // TODO -typesafe way to get an event string for use in 'render'?
  // export type Event<TEvent extends LiveEvent> = TEvent["type"];
  // getEvent(event: Event<TEvents>): string;
}

/**
 * Abstract `LiveView` class that is easy to extend for any class-based `LiveView`
 */
export abstract class BaseLiveView<
  TContext extends LiveContext = AnyLiveContext,
  TEvents extends LiveEvent = AnyLiveEvent,
  TInfos extends LiveInfo = AnyLiveInfo
> implements LiveView<TContext, TEvents, TInfos>
{
  mount(socket: LiveViewSocket<TContext, TInfos>, session: Partial<SessionData>, params: LiveViewMountParams) {
    // no-op
  }
  handleEvent(event: TEvents, socket: LiveViewSocket<TContext, TInfos>) {
    // istanbul ignore next
    console.warn(
      `handleEvent not implemented for ${this.constructor.name} but event received: ${JSON.stringify(event)}`
    );
  }
  handleInfo(info: TInfos, socket: LiveViewSocket<TContext, TInfos>) {
    // istanbul ignore next
    console.warn(`handleInfo not implemented for ${this.constructor.name} but info received: ${JSON.stringify(info)}`);
  }
  handleParams(url: URL, socket: LiveViewSocket<TContext, TInfos>) {
    // no-op
  }
  shutdown(id: string, context: TContext): void | Promise<void> {
    // no-op
  }

  abstract render(context: TContext, meta: LiveViewMeta<TEvents>): LiveViewTemplate | Promise<LiveViewTemplate>;
}

/**
 * Set of methods that can (or must be) defined when using the `createLiveView` factory function.
 * @see `createLiveView`, `LiveView`, `BaseLiveView`
 */
interface BaseLiveViewParams<
  TContext extends LiveContext = AnyLiveContext,
  TEvents extends LiveEvent = AnyLiveEvent,
  TInfos extends LiveInfo = AnyLiveInfo
> {
  mount?: (
    socket: LiveViewSocket<TContext, TInfos>,
    session: Partial<SessionData>,
    params: LiveViewMountParams
  ) => void | Promise<void>;
  handleParams?: (url: URL, socket: LiveViewSocket<TContext, TInfos>) => void | Promise<void>;
  handleEvent?: (event: TEvents, socket: LiveViewSocket<TContext, TInfos>) => void | Promise<void>;
  handleInfo?: (info: TInfos, socket: LiveViewSocket<TContext, TInfos>) => void | Promise<void>;
  shutdown?: (id: string, context: TContext) => void | Promise<void>;
  render(context: TContext, meta: LiveViewMeta<TEvents>): LiveViewTemplate | Promise<LiveViewTemplate>;
}

/**
 * Functional `LiveView` factory method for generating a `LiveView`.
 * @param params the BaseLiveViewParams with methods available to implement for a `LiveView`
 * @returns the `LiveView` instance
 */
export const createLiveView = <
  TContext extends LiveContext = AnyLiveContext,
  TEvents extends LiveEvent = AnyLiveEvent,
  TInfos extends LiveInfo = AnyLiveInfo
>(
  params: BaseLiveViewParams<TContext, TEvents, TInfos>
): LiveView<TContext, TEvents, TInfos> => {
  return {
    // default imps
    mount: () => {},
    handleParams: () => {},
    handleEvent: (event) => {
      // istanbul ignore next
      console.warn(`handleEvent not implemented in LiveView but event received: ${JSON.stringify(event)}`);
    },
    handleInfo: (info) => {
      // istanbul ignore next
      console.warn(`handleInfo not implemented in LiveView but info received: ${JSON.stringify(info)}`);
    },
    shutdown: () => {},
    // replace default impls with params if they are defined
    ...params,
  };
};

/**
 * LiveViewTemplate renderer that lays out the html elements for all of
 * the `LiveView`.  It is required that this page sets the csrf meta tag using
 * the passed in `csrfToken` and  required that it embeds the passed in `LiveViewTemplate`
 * content.
 */
export type LiveViewHtmlPageTemplate = (
  pageTitleDefault: LiveTitleOptions,
  csrfToken: string,
  content: LiveViewTemplate
) => LiveViewTemplate | Promise<LiveViewTemplate>;

/**
 * Define a renderer that can embed a rendered `LiveView` and is given access to the
 * session data.  Often used to as a common container for `LiveView`s that adds "flash"
 * messages and other common UI elements.  It is required that this renderer embeds the
 * passed in `LiveViewTemplate` content.
 */
export type LiveViewWrapperTemplate = (
  sessionData: SessionData,
  content: LiveViewTemplate
) => LiveViewTemplate | Promise<LiveViewTemplate>;
