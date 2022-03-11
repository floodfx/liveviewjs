import { WebSocket } from "ws";
import { LiveViewTemplate } from ".";

/**
 * Contexts can only be objects with string keys.
 */
export interface LiveComponentContext {[key: string]: unknown}

export interface LiveComponentMeta {
  /**
   * the id of the component if it is stateful or undefined if it is stateless.
   * Generally used to identify this component in a `phx-target` attribute of
   * a `LiveViewTemplate`.
   *
   * Note this is not the same as the `id` property of the component, rather it
   * is the index of the `LiveComponent` in the `LiveView`.
   */
  myself?: number;
}

/**
 * Represents the `LiveComponent`'s websocket connectedness along with current
 * state of the component.  Also provides a method for sending messages
 * internally to the parent `LiveView`.
 */
export interface LiveComponentSocket<Context extends LiveComponentContext> {
  /**
   * The id of the parent `LiveView`
   */
  id: string;
  // cid: number; TODO should we provide this as well?
  /**
   * Whether the websocket is connected (i.e. http request or joined via websocket)
   * true if connected to a websocket, false for http request
   */
  connected: boolean;
  /**
   * Read-only, current state of the `LiveComponent`
   */
  context: Context;
  /**
   * The actual websocket connection (if connected)
   */
  ws?: WebSocket;
  /**
   * helper method to send messages to the parent `LiveView` - requires the parent
   * `LiveView` to implement `handleInfo`.
   */
  send: (event: unknown) => void;
  /**
   * `assign` is used to update the `Context` (i.e. state) of the `LiveComponent`
   */
  assign: (context: Partial<Context>) => void;
  /**
   * helper method to send events to Hooks on the parent `LiveView`
   */
  pushEvent: (event: string, params: Record<string, any>) => void;
}

abstract class BaseLiveComponentSocket<Context extends LiveComponentContext> implements LiveComponentSocket<Context> {

  readonly id: string;
  private _context: Context;

  constructor(id: string, context: Context) {
    this.id = id;
    this._context = context;
  }

  get context(): Context {
    return this._context || {};
  }

  assign(context: Partial<Context>) {
    this._context = {
      ...this.context,
      ...context
    }
  }

  send(event: unknown) {
    // no-op
  }

  pushEvent(event: string, params: Record<string, any>) {
    // no-op
  }

  abstract connected: boolean;

}

export class HttpLiveComponentSocket<Context extends LiveComponentContext> extends BaseLiveComponentSocket<Context> {

  readonly connected: boolean = false;

  constructor(id: string, context: Context) {
    super(id, context);
  }

}

export class WsLiveComponentSocket<Context extends LiveComponentContext> extends BaseLiveComponentSocket<Context> {

  readonly connected: boolean = true;

  private sendCallback:  (event: unknown) => void;
  private pushEventCallback: (event: string, params: Record<string, any>) => void;

  constructor(id: string, context: Context, sendCallback: (event: unknown) => void, pushEventCallback: (event: string, params: Record<string, any>) => void) {
    super(id, context);
    this.sendCallback = sendCallback;
    this.pushEventCallback = pushEventCallback;
  }

  send(event: unknown) {
    this.sendCallback(event);
  }

  pushEvent(event: string, params: Record<string, any>): void {
    this.pushEventCallback(event, params);
  }
}

/**
 * A `LiveComponent` is a component that is embedded in a `LiveView` via
 * the `live_component` helper.  Their lifecycle is managed by and the same length
 * as their parent `LiveView`.
 *
 * `LiveComponent`s can be stateless or stateful.  Stateless components' lifecycle
 * consists of running `preload`, `mount`, `update`, and `render` when any new data is received
 * (via the `live_component` helper).  Stateful components' lifecycle consists is different.
 * Stateful components' lifecycle consists of running `preload` `mount`, `update`, and `render`
 * on the first time a `LiveComponent` is loaded followed by `preload`, `update`, and `render` on
 * subsequent renders.  In other words, subsequent updates only run `preload`, `update` and `render`
 * and the state (contenxt) is managed for the lifecycle of the `LiveView`.
 *
 * To make a `LiveComponent` stateful, you must pass an `id` to the `live_component` helper in the
 * `LiveView` template.
 */
export interface LiveComponent<Context extends LiveComponentContext> {

  /**
   * `preload` is useful when multiple `LiveComponent`s of the same type are loaded
   * within the same `LiveView` and you want to preload data for all of them in batch.
   * This helps to solve the N+1 query problem.
   * @param contextsList
   */
  // preload(contextsList: Context[]): Partial<Context>[];

  /**
   * Mounts the `LiveComponent`'s stateful context.  This is called only once
   * for stateful `LiveComponent` and always for a stateless `LiveComponent`.
   * This is called prior to `update` and `render`.
   *
   * @param socket a `LiveComponentSocket` with the context for this `LiveComponent`
   */
  mount(socket: LiveComponentSocket<Context>): void | Promise<void>;

  /**
   * Allows the `LiveComponent` to update its stateful context.  This is called
   * prior to `render` for both stateful and stateless `LiveComponent`s.  This is a
   * good place to add additional business logic to the `LiveComponent` if you
   * need to manipulate or otherwise update the context.
   *
   * You only need to return a `Partial<Context>` with the changes you want to
   * make to the context.  The `LiveView` will merge the changes with the existing
   * state (context).
   *
   * @param context the current state for this `LiveComponent`
   * @param socket a `LiveComponentSocket` with the context for this `LiveComponent`
   */
  update(socket:LiveComponentSocket<Context>): void | Promise<void>;

  /**
   * Renders the `LiveComponent` by returning a `LiveViewTemplate`.  Each time a
   * a `LiveComponent` receives new data, it will be re-rendered.
   * @param context the current state for this `LiveComponent`
   * @param meta a `LiveComponentMeta` with additional meta data for this `LiveComponent`
   */
  render(context: Context, meta: LiveComponentMeta): LiveViewTemplate;

  /**
   *
   * @param event the event name coming from the `LiveComponent`
   * @param params a list of string-to-string key/value pairs related to the event
   * @param socket a `LiveComponentSocket` with the context for this `LiveComponent`
   */
  handleEvent(event: string, params: Record<string, string>, socket: LiveComponentSocket<Context>): void | Promise<void>;

}

/**
 * Abstract base class implementation of a `LiveComponent` which can be used by
 * either a stateful or stateless `LiveComponent`.  `BaseLiveComponent` implements
 * `preload`, `mount`, `update`, and `handleEvent` with no-op implementations. Therefore
 * one can extend this class and simply implement the `render` function.  If you have
 * a stateful `LiveComponent` you most likely want to implement at least `mount` and
 * perhaps `update` as well.  See `LiveComponent` for more details.
 */
export abstract class BaseLiveComponent<Context extends LiveComponentContext> implements LiveComponent<Context> {

  // preload(contextsList: Context[]): Partial<Context>[] {
  //   return contextsList;
  // }

  mount(socket: LiveComponentSocket<Context>) {
    // no-op
  }

  update(socket: LiveComponentSocket<Context>) {
    // no-op
  }

  handleEvent(event: string, params: Record<string, string>, socket: LiveComponentSocket<Context>) {
    // no-op
  }

  abstract render(context: Context, meta: LiveComponentMeta): LiveViewTemplate;

}