import { LiveViewTemplate } from ".";
import { AnyLiveContext, AnyLiveEvent, AnyLiveInfo, AnyLivePushEvent, LiveContext, LiveEvent } from "./liveView";

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
export interface LiveComponentSocket<TContext extends LiveContext = AnyLiveContext> {
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
  context: TContext;
  /**
   * helper method to send messages to the parent `LiveView` via the `handleInfo`
   */
  send(info: AnyLiveInfo): void;
  /**
   * `assign` is used to update the `Context` (i.e. state) of the `LiveComponent`
   */
  assign(context: Partial<TContext>): void;
  /**
   * helper method to send events to Hooks on the parent `LiveView`
   */
  pushEvent(pushEvent: AnyLivePushEvent): void;
}

abstract class BaseLiveComponentSocket<TContext extends LiveContext = AnyLiveContext>
  implements LiveComponentSocket<TContext>
{
  readonly id: string;
  private _context: TContext;

  constructor(id: string, context: TContext) {
    this.id = id;
    this._context = context;
  }

  get context(): TContext {
    return this._context || ({} as TContext);
  }

  assign(context: Partial<TContext>) {
    this._context = {
      ...this.context,
      ...context,
    };
  }

  send(info: AnyLiveInfo) {
    // no-op
  }

  pushEvent(pushEvent: AnyLivePushEvent) {
    // no-op
  }

  abstract connected: boolean;
}

export class HttpLiveComponentSocket<
  TContext extends LiveContext = AnyLiveContext
> extends BaseLiveComponentSocket<TContext> {
  readonly connected: boolean = false;

  constructor(id: string, context: TContext) {
    super(id, context);
  }
}

export class WsLiveComponentSocket<
  TContext extends LiveContext = AnyLiveContext
> extends BaseLiveComponentSocket<TContext> {
  readonly connected: boolean = true;

  private sendCallback: (info: AnyLiveInfo) => void;
  private pushEventCallback: (pushEvent: AnyLivePushEvent) => void;

  constructor(
    id: string,
    context: TContext,
    sendCallback: (info: AnyLiveInfo) => void,
    pushEventCallback: (pushEvent: AnyLivePushEvent) => void
  ) {
    super(id, context);
    this.sendCallback = sendCallback;
    this.pushEventCallback = pushEventCallback;
  }

  send(info: AnyLiveInfo) {
    this.sendCallback(info);
  }

  pushEvent(pushEvent: AnyLivePushEvent): void {
    this.pushEventCallback(pushEvent);
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
export interface LiveComponent<
  TContext extends LiveContext = AnyLiveContext,
  TEvents extends LiveEvent = AnyLiveEvent
> {
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
  mount(socket: LiveComponentSocket<TContext>): void | Promise<void>;

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
  update(socket: LiveComponentSocket<TContext>): void | Promise<void>;

  /**
   * Renders the `LiveComponent` by returning a `LiveViewTemplate`.  Each time a
   * a `LiveComponent` receives new data, it will be re-rendered.
   * @param context the current state for this `LiveComponent`
   * @param meta a `LiveComponentMeta` with additional meta data for this `LiveComponent`
   */
  render(context: TContext, meta: LiveComponentMeta): LiveViewTemplate | Promise<LiveViewTemplate>;

  /**
   * Handles events from the `LiveView` initiated by the end-user
   * @param event a `LiveEvent` received from client
   * @param socket a `LiveComponentSocket` with the context for this `LiveComponent`
   */
  handleEvent(event: TEvents, socket: LiveComponentSocket<TContext>): void | Promise<void>;
}

/**
 * Abstract base class implementation of a `LiveComponent` which can be used by
 * either a stateful or stateless `LiveComponent`.  `BaseLiveComponent` implements
 * `preload`, `mount`, `update`, and `handleEvent` with no-op implementations. Therefore
 * one can extend this class and simply implement the `render` function.  If you have
 * a stateful `LiveComponent` you most likely want to implement at least `mount` and
 * perhaps `update` as well.  See `LiveComponent` for more details.
 */
export abstract class BaseLiveComponent<
  TContext extends LiveContext = AnyLiveContext,
  TEvents extends LiveEvent = AnyLiveEvent
> implements LiveComponent<TContext, TEvents>
{
  // preload(contextsList: Context[]): Partial<Context>[] {
  //   return contextsList;
  // }

  mount(socket: LiveComponentSocket<TContext>) {
    // no-op
  }

  update(socket: LiveComponentSocket<TContext>) {
    // no-op
  }

  handleEvent(event: TEvents, socket: LiveComponentSocket<TContext>) {
    // no-op
  }

  abstract render(context: TContext, meta: LiveComponentMeta): LiveViewTemplate | Promise<LiveViewTemplate>;
}
