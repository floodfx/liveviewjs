import { AnyLiveContext, AnyLiveInfo, AnyLivePushEvent, LiveContext } from "../live";

/**
 * Main interface to update state, interact, manage, message, and otherwise
 * manage the lifecycle of a `LiveView`.
 *
 * The `LiveView` API (i.e. `mount`, `handleParams`, `handleInfo`, `handleEvent`)
 * are all passed `LiveViewSocket` which provide access to the current `LiveView`
 * context (via `context`) as well as various methods update the `LiveView` including
 * `assign` which updates the `LiveView`'s context (i.e. state).
 */
export interface LiveViewSocket<TContext extends LiveContext = AnyLiveContext> {
  /**
   * The id of the `LiveView` (same as the `phx_join` id)
   */
  id: string;
  /**
   * Whether the websocket is connected.
   * true if connected to a websocket, false for http request
   */
  connected: boolean;
  /**
   * The current state of the `LiveView`
   */
  context: TContext;
  /**
   * `assign` is used to update the `Context` (i.e. state) of the `LiveComponent`
   * @param context you can pass a partial of the current context to update
   */
  assign(context: Partial<TContext>): void;
  /**
   * Marks any set properties as temporary and will be reset to the given
   * value after the next render cycle.  Typically used to ensure large but
   * infrequently updated values are not kept in memory.
   *
   * @param context a partial of the context that should be temporary and the value to reset it to
   */
  tempAssign(context: Partial<TContext>): void;
  /**
   * Updates the `<title>` tag of the `LiveView` page.  Requires using the
   * `live_title` helper in rendering the page.
   *
   * @param newPageTitle the new text value of the page - note the prefix and suffix will not be changed
   */
  pageTitle(newPageTitle: string): void;
  /**
   * Pushes data from the server to the client with the given event name and
   * params.  Requires a client `Hook` to be defined and to be listening for
   * the event via `this.handleEvent` callback.
   *
   * @param event the name of the event to push to the client
   * @param params the data to pass to the client
   */
  pushEvent(pushEvent: AnyLivePushEvent): void;
  /**
   * Updates the browser's URL with the given path and query parameters.
   *
   * @param path the path whose query params are being updated
   * @param params the query params to update the path with
   * @param replaceHistory whether to replace the current history entry or push a new one (defaults to false)
   */
  // pushPatch(path: string, params: Record<string, string | number>): void;
  pushPatch(path: string, params?: Record<string, string | number>, replaceHistory?: boolean): void;

  /**
   * Shutdowns the current `LiveView` and load another `LiveView` in its place without reloading the
   * whole page (i.e. making a full HTTP request).  Can be used to remount the current `LiveView` if
   * need be. Use `pushPatch` to update the current `LiveView` without unloading and remounting.
   *
   * @param path the path whose query params are being updated
   * @param params the query params to update the path with
   * @param replaceHistory whether to replace the current history entry or push a new one (defaults to false)
   */
  pushRedirect(path: string, params?: Record<string, string | number>, replaceHistory?: boolean): void;
  /**
   * Add flash to the socket for a given key and value.
   * @param key
   * @param value
   */
  putFlash(key: string, value: string): void;
  /**
   * Runs the given function on the given interval until this `LiveView` is
   * unloaded.
   *
   * @param fn the function to run on the interval
   * @param intervalMillis the interval to run the function on in milliseconds
   */
  repeat(fn: () => void, intervalMillis: number): void;
  /**
   * Send an event internally to the server which initiates a `LiveView.handleInfo` invocation.
   *
   * @param event the event to send to `handleInfo`
   */
  send(info: AnyLiveInfo): void;
  /**
   * Subscribes to the given topic using pub/sub.  Any events published to the topic
   * will be received by the `LiveView` instance via `handleEvent`.
   *
   * @param topic the topic to subscribe this `LiveView` to
   */
  subscribe(topic: string): void;
}

abstract class BaseLiveViewSocket<TContext extends LiveContext = AnyLiveContext> implements LiveViewSocket<TContext> {
  abstract connected: boolean;
  abstract id: string;

  private _context: TContext;
  private _tempContext: Partial<TContext> = {}; // values to reset the context to post render cycle

  get context(): TContext {
    return this._context || ({} as TContext);
  }

  assign(context: Partial<TContext>) {
    this._context = {
      ...this.context,
      ...context,
    };
  }

  tempAssign(tempContext: Partial<TContext>) {
    this._tempContext = {
      ...this._tempContext,
      ...tempContext,
    };
  }

  pageTitle(newPageTitle: string) {
    // no-op
  }
  pushEvent(pushEvent: AnyLivePushEvent) {
    // no-op
  }
  pushPatch(path: string, params?: Record<string, string | number>, replaceHistory?: boolean) {
    // no-op
  }
  pushRedirect(path: string, params?: Record<string, string | number>, replaceHistory?: boolean) {
    // no-op
  }
  putFlash(key: string, value: string) {
    // no-op
  }
  repeat(fn: () => void, intervalMillis: number) {
    // no-op
  }
  send(info: AnyLiveInfo) {
    // no-op
  }
  subscribe(topic: string) {
    // no-op
  }

  updateContextWithTempAssigns() {
    if (Object.keys(this._tempContext).length > 0) {
      this.assign(this._tempContext);
    }
  }
}

/**
 * Used to render Http requests for `LiveView`s.  Only support setting the context via
 * `assign` and reading the context via `context`.
 */
export class HttpLiveViewSocket<Context> extends BaseLiveViewSocket<Context> {
  readonly id: string;
  readonly connected: boolean = false;

  private _redirect: { to: string; replace: boolean } | undefined;
  constructor(id: string) {
    super();
    this.id = id;
  }

  get redirect(): { to: string; replace: boolean } | undefined {
    return this._redirect;
  }

  pushRedirect(path: string, params?: Record<string, string | number>, replaceHistory?: boolean): void {
    let stringParams: string | undefined;
    const urlParams = new URLSearchParams();
    if (params && Object.keys(params).length > 0) {
      for (const [key, value] of Object.entries(params)) {
        urlParams.set(key, String(value));
      }
      stringParams = urlParams.toString();
    }

    const to = stringParams ? `${path}?${stringParams}` : path;
    this._redirect = {
      to,
      replace: replaceHistory || false,
    };
  }
}

/**
 * Full inmplementation used once a `LiveView` is mounted to a websocket.
 */
export class WsLiveViewSocket extends BaseLiveViewSocket {
  readonly id: string;
  readonly connected: boolean = true;

  pushEventData?: { event: string; params: Record<string, any> };
  pageTitleData?: string;

  // callbacks to the ComponentManager
  private pageTitleCallback: (newPageTitle: string) => void;
  private pushEventCallback: (pushEvent: AnyLivePushEvent) => void;
  private pushPatchCallback: (path: string, params?: Record<string, string | number>, replaceHistory?: boolean) => void;
  private pushRedirectCallback: (
    path: string,
    params?: Record<string, string | number>,
    replaceHistory?: boolean
  ) => void;
  private putFlashCallback: (key: string, value: string) => void;
  private repeatCallback: (fn: () => void, intervalMillis: number) => void;
  private sendCallback: (info: AnyLiveInfo) => void;
  private subscribeCallback: (topic: string) => void;

  constructor(
    id: string,
    pageTitleCallback: (newPageTitle: string) => void,
    pushEventCallback: (pushEvent: AnyLivePushEvent) => void,
    pushPatchCallback: (path: string, params?: Record<string, string | number>, replaceHistory?: boolean) => void,
    pushRedirectCallback: (path: string, params?: Record<string, string | number>, replaceHistory?: boolean) => void,
    putFlashCallback: (key: string, value: string) => void,
    repeatCallback: (fn: () => void, intervalMillis: number) => void,
    sendCallback: (info: AnyLiveInfo) => void,
    subscribeCallback: (topic: string) => void
  ) {
    super();
    this.id = id;
    this.pageTitleCallback = pageTitleCallback;
    this.pushEventCallback = pushEventCallback;
    this.pushPatchCallback = pushPatchCallback;
    this.pushRedirectCallback = pushRedirectCallback;
    this.putFlashCallback = putFlashCallback;
    this.repeatCallback = repeatCallback;
    this.sendCallback = sendCallback;
    this.subscribeCallback = subscribeCallback;
  }
  putFlash(key: string, value: string): void {
    this.putFlashCallback(key, value);
  }
  pageTitle(newPageTitle: string) {
    this.pageTitleCallback(newPageTitle);
  }
  pushEvent(pushEvent: AnyLivePushEvent) {
    this.pushEventCallback(pushEvent);
  }
  pushPatch(path: string, params?: Record<string, string | number>, replaceHistory: boolean = false) {
    this.pushPatchCallback(path, params, replaceHistory);
  }
  pushRedirect(path: string, params?: Record<string, string | number>, replaceHistory: boolean = false) {
    this.pushRedirectCallback(path, params, replaceHistory);
  }
  repeat(fn: () => void, intervalMillis: number) {
    this.repeatCallback(fn, intervalMillis);
  }
  send(info: AnyLiveInfo) {
    this.sendCallback(info);
  }
  subscribe(topic: string) {
    this.subscribeCallback(topic);
  }
}