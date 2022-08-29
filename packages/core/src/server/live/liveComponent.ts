import { LiveViewTemplate } from ".";
import { Info } from "../socket";
import {
  AnyLiveContext,
  AnyLiveEvent,
  AnyLiveInfo,
  AnyLivePushEvent,
  LiveContext,
  LiveEvent,
  LiveInfo,
} from "./liveView";

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
export interface LiveComponentSocket<
  TContext extends LiveContext = AnyLiveContext,
  TInfo extends LiveInfo = AnyLiveInfo
> {
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
  sendParentInfo(info: Info<TInfo>): void;
  /**
   * `assign` is used to update the `Context` (i.e. state) of the `LiveComponent`
   */
  assign(context: Partial<TContext>): void;
  /**
   * helper method to send events to Hooks on the parent `LiveView`
   */
  pushEvent(pushEvent: AnyLivePushEvent): void;
}

abstract class BaseLiveComponentSocket<
  TContext extends LiveContext = AnyLiveContext,
  TInfo extends LiveInfo = AnyLiveInfo
> implements LiveComponentSocket<TContext, TInfo>
{
  readonly id: string;
  private _context: TContext;

  constructor(id: string, context: TContext) {
    this.id = id;
    this._context = context ?? ({} as TContext);
  }

  get context(): TContext {
    return this._context;
  }

  assign(context: Partial<TContext>) {
    this._context = {
      ...this.context,
      ...context,
    };
  }

  sendParentInfo(info: Info<TInfo>) {
    // no-op
  }

  pushEvent(pushEvent: AnyLivePushEvent) {
    // no-op
  }

  abstract connected: boolean;
}

export class HttpLiveComponentSocket<
  TContext extends LiveContext = AnyLiveContext,
  TInfo extends LiveInfo = AnyLiveInfo
> extends BaseLiveComponentSocket<TContext, TInfo> {
  readonly connected: boolean = false;

  constructor(id: string, context: TContext) {
    super(id, context);
  }
}

export class WsLiveComponentSocket<
  TContext extends LiveContext = AnyLiveContext,
  TInfo extends LiveInfo = AnyLiveInfo
> extends BaseLiveComponentSocket<TContext, TInfo> {
  readonly connected: boolean = true;

  private sendParentCallback: (info: Info<TInfo>) => void;
  private pushEventCallback: (pushEvent: AnyLivePushEvent) => void;

  constructor(
    id: string,
    context: TContext,
    sendParentCallback: (info: Info<TInfo>) => void,
    pushEventCallback: (pushEvent: AnyLivePushEvent) => void
  ) {
    super(id, context);
    this.sendParentCallback = sendParentCallback;
    this.pushEventCallback = pushEventCallback;
  }

  sendParentInfo(info: Info<TInfo>) {
    this.sendParentCallback(info);
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
  TEvents extends LiveEvent = AnyLiveEvent,
  TInfo extends LiveInfo = AnyLiveInfo
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
   * for stateful `LiveComponent` and every render for a stateless `LiveComponent`.
   * This is called prior to `update` and `render`.
   *
   * @param socket a `LiveComponentSocket` with the context for this `LiveComponent`
   */
  mount(socket: LiveComponentSocket<TContext, TInfo>): void | Promise<void>;

  /**
   * Allows the `LiveComponent` to update its stateful context.  This is called
   * prior to `render` for both stateful and stateless `LiveComponent`s.  This is a
   * good place to add additional business logic to the `LiveComponent` if you
   * need to change the context (e.g. derive data from or transform) of the `LiveComponentSocket`.
   *
   * @param socket a `LiveComponentSocket` with the context for this `LiveComponent`
   */
  update(socket: LiveComponentSocket<TContext, TInfo>): void | Promise<void>;

  /**
   * Optional method that handles events from the `LiveComponent` initiated by the end-user. Only
   * called for "stateful" `LiveComponent`s (i.e. `LiveComponent`s with an "id" in their context).
   * In other words, only components with an `id` attribute in their "LiveContext" can handleEvents.
   * @param event the `TEvents` received from client
   * @param socket a `LiveComponentSocket` with the context for this `LiveComponent`
   */
  handleEvent?: (event: TEvents, socket: LiveComponentSocket<TContext, TInfo>) => void | Promise<void>;

  /**
   * Renders the `LiveComponent` by returning a `LiveViewTemplate`.  Each time a
   * a `LiveComponent` receives new data, it will be re-rendered.
   * @param context the current state for this `LiveComponent`
   * @param meta a `LiveComponentMeta` with additional meta data for this `LiveComponent`
   */
  render(context: TContext, meta: LiveComponentMeta): LiveViewTemplate | Promise<LiveViewTemplate>;
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
  TEvents extends LiveEvent = AnyLiveEvent,
  TInfo extends LiveInfo = AnyLiveInfo
> implements LiveComponent<TContext, TEvents, TInfo>
{
  // preload(contextsList: Context[]): Partial<Context>[] {
  //   return contextsList;
  // }

  mount(socket: LiveComponentSocket<TContext, TInfo>) {
    // no-op
  }

  update(socket: LiveComponentSocket<TContext, TInfo>) {
    // no-op
  }

  // leave handleEvent unimplemented by default

  abstract render(context: TContext, meta: LiveComponentMeta): LiveViewTemplate | Promise<LiveViewTemplate>;
}

/**
 * Shape of parameters passed to the `createLiveComponent` factory function to create a `LiveComponent`.
 * @see `createLiveComponent`
 * @see `LiveComponent`
 */
interface CreateLiveComponentParams<
  TContext extends LiveContext = AnyLiveContext,
  TEvents extends LiveEvent = AnyLiveEvent,
  TInfos extends LiveInfo = AnyLiveInfo
> {
  mount?: (socket: LiveComponentSocket<TContext, TInfos>) => void | Promise<void>;
  update?: (socket: LiveComponentSocket<TContext, TInfos>) => void | Promise<void>;
  handleEvent?: (event: TEvents, socket: LiveComponentSocket<TContext, TInfos>) => void | Promise<void>;
  render(context: TContext, meta: LiveComponentMeta): LiveViewTemplate | Promise<LiveViewTemplate>;
}

/**
 * Creates a `LiveComponent` given the `CreateLiveComponentParams` and shape of the `LiveContext`, `LiveEvent` and `LiveInfo`.
 * @param params the `CreateLiveComponentParams` with optionally implemented methods for each
 * @returns the `LiveComponent` instance
 */
export const createLiveComponent = <
  TContext extends LiveContext = AnyLiveContext,
  TEvents extends LiveEvent = AnyLiveEvent,
  TInfos extends LiveInfo = AnyLiveInfo
>(
  params: CreateLiveComponentParams<TContext, TEvents, TInfos>
): LiveComponent<TContext, TEvents, TInfos> => {
  return {
    // default imps
    mount: () => {},
    update: () => {},
    // replace default impls with params if they are defined
    ...params,
  };
};
