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
   * helper method to send messages back to the `LiveView` -
   * requires the `LiveView` to implement `handleInfo`.
   */

  pageTitle: (newPageTitle: string) => void;
  pushEvent: (event: string, params: Record<string, any>) => void;
  pushPatch: (path: string, params: Record<string, string | number>) => void;
  repeat: (fn: () => void, intervalMillis: number) => void;
  send: (event: unknown) => void;
  subscribe: (topic: string) => void;
}

abstract class BaseLiveViewSocket<Context extends LiveViewContext> implements LiveViewSocket<Context> {
  abstract connected: boolean;
  abstract id: string;

  private _context: Context;

  get context(): Context {
    return this._context || {};
  }

  assign(context: Partial<Context>) {
    this._context = {
      ...this.context,
      ...context,
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
}

/**
 * Minimal implementation which only provides `context` and `assign` for use with
 * HTTP requests.
 */
export class HttpLiveViewSocket<Context extends LiveViewContext>
  extends BaseLiveViewSocket<Context>
  implements LiveViewSocket<Context>
{
  readonly id: string;
  readonly connected: boolean = false;

  constructor(id: string, context: Context) {
    super();
    this.id = id;
    this.assign(context);
  }
}

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
