import { LiveViewContext } from "../component";
/**
 * Main interface to update state, interact, manage, message, and otherwise
 * manage the lifecycle of a `LiveView`.
 *
 * The `LiveView` API (i.e. `mount`, `handleParams`, `handleInfo`, `handleEvent`)
 * are all passed `LiveViewSocket` which provide access to the current `LiveView`
 * context (via `context`) as well as various methods update the `LiveView` including
 * `assign` which updates the `LiveView`'s context (i.e. state).
 */
export interface LiveViewSocket<Context extends LiveViewContext> {
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
  context: Context;
  /**
   * `assign` is used to update the `Context` (i.e. state) of the `LiveComponent`
   * @param context you can pass a partial of the current context to update
   */
  assign: (context: Partial<Context>) => void;
  /**
   * Marks any set properties as temporary and will be reset to the given
   * value after the next render cycle.  Typically used to ensure large but
   * infrequently updated values are not kept in memory.
   */
  tempAssign: (context: Partial<Context>) => void;
  /**
   * Updates the `<title>` tag of the `LiveView` page.  Requires using the
   * `live_title` helper in rendering the page.
   */
  pageTitle: (newPageTitle: string) => void;
  /**
   * Pushes data from the server to the client with the given event name and
   * params.  Requires a client `Hook` to be defined and to be listening for
   * the event via `this.handleEvent` callback.
   */
  pushEvent: (event: string, params: Record<string, any>) => void;
  /**
   * Updates the browser's URL with the given path and query parameters.
   */
  pushPatch: (path: string, params: Record<string, string | number>) => void;
  /**
   * Runs the given function on the given interval until this `LiveView` is
   * unloaded.
   */
  repeat: (fn: () => void, intervalMillis: number) => void;
  /**
   * Initiates a `LiveView.handleInfo` event from within the `LiveView` itself.
   */
  send: (event: unknown) => void;
  /**
   * Subscribes to the given topic using pub/sub.  Any events published to the topic
   * will be received by the `LiveView` instance via `handleEvent`.
   */
  subscribe: (topic: string) => void;
}

export interface PartialLiveViewSocket<Context extends LiveViewContext> extends LiveViewSocket<Context> {}

abstract class BaseLiveViewSocket<Context extends LiveViewContext> implements LiveViewSocket<Context> {
  abstract connected: boolean;
  abstract id: string;

  private _context: Context;
  private _tempContext: Partial<Context> = {}; // values to reset the context to post render cycle

  get context(): Context {
    return this._context || ({} as Context);
  }

  assign(context: Partial<Context>) {
    this._context = {
      ...this.context,
      ...context,
    };
  }

  tempAssign(tempContext: Partial<Context>) {
    this._tempContext = {
      ...this._tempContext,
      ...tempContext,
    };
  }

  pageTitle(newPageTitle: string) {
    // no-op
  }
  pushEvent(event: string, params: Record<string, any>) {
    // no-op
  }
  pushPatch(path: string, params: Record<string, string | number>) {
    // no-op
  }
  repeat(fn: () => void, intervalMillis: number) {
    // no-op
  }
  send(event: unknown) {
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
export class HttpLiveViewSocket<Context extends LiveViewContext>
  extends BaseLiveViewSocket<Context>
  implements LiveViewSocket<Context>
{
  readonly id: string;
  readonly connected: boolean = false;

  constructor(id: string) {
    super();
    this.id = id;
  }
}

/**
 * Full inmplementation used once a `LiveView` is mounted to a websocket.
 */
export class WsLiveViewSocket<Context extends LiveViewContext>
  extends BaseLiveViewSocket<Context>
  implements LiveViewSocket<Context>
{
  readonly id: string;
  readonly connected: boolean = true;

  pushEventData?: { event: string; params: Record<string, any> };
  pageTitleData?: string;

  // callbacks to the ComponentManager
  private subscribeCallback: (topic: string) => void;
  private pushPatchCallback: (path: string, params: Record<string, string | number>) => void;
  private pushEventCallback: (event: string, params: Record<string, any>) => void;
  private pageTitleCallback: (newPageTitle: string) => void;
  private repeatCallback: (fn: () => void, intervalMillis: number) => void;
  private sendCallback: (event: unknown) => void;

  constructor(
    id: string,
    pageTitleCallback: (newPageTitle: string) => void,
    pushEventCallback: (event: string, params: Record<string, any>) => void,
    pushPatchCallback: (path: string, params: Record<string, string | number>) => void,
    repeatCallback: (fn: () => void, intervalMillis: number) => void,
    sendCallback: (event: unknown) => void,
    subscribeCallback: (topic: string) => void
  ) {
    super();
    this.id = id;
    this.pageTitleCallback = pageTitleCallback;
    this.pushEventCallback = pushEventCallback;
    this.pushPatchCallback = pushPatchCallback;
    this.repeatCallback = repeatCallback;
    this.sendCallback = sendCallback;
    this.subscribeCallback = subscribeCallback;
  }

  pageTitle(newPageTitle: string) {
    this.pageTitleCallback(newPageTitle);
  }
  pushEvent(event: string, params: Record<string, any>) {
    this.pushEventCallback(event, params);
  }
  pushPatch(path: string, params: Record<string, string | number>) {
    this.pushPatchCallback(path, params);
  }
  repeat(fn: () => void, intervalMillis: number) {
    this.repeatCallback(fn, intervalMillis);
  }
  send(event: unknown) {
    this.sendCallback(event);
  }
  subscribe(topic: string) {
    this.subscribeCallback(topic);
  }
}
