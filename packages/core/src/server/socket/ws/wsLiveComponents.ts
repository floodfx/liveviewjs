import {
  AnyLiveContext,
  AnyLiveEvent,
  AnyLiveInfo,
  AnyLivePushEvent,
  LiveComponent,
  LiveContext,
  LiveViewTemplate,
  WsLiveComponentSocket,
} from "../../../server/live";
import { deepDiff, HtmlSafeString, Parts } from "../../../server/templates";
import { Info } from "../liveSocket";

/**
 * State kept for each `LiveComponent` instance.
 */
class LiveComponentState<TContext extends LiveContext = AnyLiveContext> {
  /**
   * id (`${hash}_${params.id}`) of the component which is used to uniquely identify it
   * across the entire application.
   */
  id: string;
  /**
   * The last calculated state of the component.
   */
  context: TContext;
  /**
   * The last `Parts` tree rendered by the component.
   */
  parts: Parts;
  /**
   * The internal componentId as calculated by the component manager as an
   * index into when the component was parsed via render.
   */
  cid: number;
  /**
   * The hash of the component (based on the serialized code), used for grouping components of the
   * same type together and running `handleEvent`s.
   */
  hash: string;
}

/**
 * The LiveComponentsContext is used to manage the lifecycle of `LiveComponent`s
 * for a `LiveView` instance.
 */
export class LiveComponentsContext {
  #hashToComponent: { [key: string]: LiveComponent<any> } = {};
  #idToState: { [key: string]: LiveComponentState } = {};
  #cidIndex = 1;
  #joinId: string;
  #onSendInfo: (info: Info<AnyLiveInfo>) => void;
  #onPushEvent: (event: AnyLivePushEvent) => void;

  constructor(
    joinId: string,
    onSendInfo: (info: Info<AnyLiveInfo>) => void,
    onPushEvent: (event: AnyLivePushEvent) => void
  ) {
    this.#joinId = joinId;
    this.#onSendInfo = onSendInfo;
    this.#onPushEvent = onPushEvent;
  }

  /**
   * Returns an array of all the LiveComponent instances.
   */
  all(): LiveComponentState[] {
    // TODO could be good place to "preload" all the components of the same type?
    return Object.values(this.#idToState);
  }

  /**
   * `load` runs a "stateless" or "stateful" lifecycle for the given `LiveComponent` and params
   * based on the presence of an `id` param. For "stateful", components we run the lifecycle
   * and store the state of the component and use it for subsequent renders and return a "placeholder"
   * LiveViewTemplate.  For "stateless" components we run the lifecycle
   * and simply return the rendered LiveViewTemplate.
   * @param c the `LiveComponent` to load
   * @param params the params to initialize the `LiveComponent` lifecycle with
   */
  async load<TContext extends LiveContext>(
    c: LiveComponent<TContext>,
    params: Partial<TContext & { id?: number | string }> = {} as TContext
  ): Promise<LiveViewTemplate> {
    // TODO - determine how to collect all the live components of the same type
    // and preload them all at once

    const pid = params.id;
    delete params.id; // remove id from param to use as default context

    // LiveComponents with "id" attributes are "stateful" which means the state of
    // context is maintained across multiple renders and it can "handleEvents"
    // Note: the id is how events are routed back to the `LiveComponent`
    if (pid !== undefined) {
      // stateful `LiveComponent`
      // lifecycle is:
      //   On First Load:
      //     preload => mount => update => render
      //   On Subsequent Loads:
      //     update => render
      //   On Events:
      //     handleEvent => render

      // check if component state exists for this component
      const { hash } = c;
      const id = `${hash}_${pid}`;
      let state = this.#idToState[id];

      let socket: WsLiveComponentSocket<TContext>;
      if (state === undefined) {
        // if no state then this is the first load so we use the params
        // and call preload (eventually) and mount
        socket = this.newSocket(params as TContext);
        await c.mount(socket);

        // create component state
        state = {
          id: id,
          // changed: true,
          cid: this.nextCid(),
          hash: hash,
          context: socket.context,
          parts: {},
        };
      }
      // we only need the context and cid for update and render
      const { context, cid } = state;

      // We have either just mounted or are on a subsequent load
      // and either case we continue with update => render
      socket = this.newSocket(structuredClone(context) as TContext);
      await c.update(socket);
      const newView = c.render({ ...socket.context }, { myself: cid });

      // let's save the component and the state
      this.saveComponent<TContext>(hash, c);
      this.saveState(id, {
        ...state,
        context: socket.context,
        parts: newView.partsTree(true),
      });

      // since "stateful" components are sent back as part of the render
      // tree (under the `c` key) we return a "placeholder" HtmlSafeString
      // that includes the cid of the component
      return new HtmlSafeString([String(cid)], [], true);
    }
    // If we've gotten here there was no "id" param
    // so this is a "stateless" `LiveComponent`

    // warn user if `handleEvent` is implemented that it cannot be called
    if (c.handleEvent) {
      console.warn(`a LiveComponent has a handleEvent method but no "id" attribute so it cannot be targeted.`);
    }

    // for "stateless" components lifecycle is always:
    // preload => mount => update => render
    // TODO preload
    const socket = this.newSocket(structuredClone(params) as TContext);
    await c.mount(socket);
    await c.update(socket);
    // since this is a stateless component, we send back the LiveViewTemplate
    return c.render(socket.context, { myself: pid });
  }

  /**
   * handleEvent routes an event to the correct `LiveComponent` instance based on the
   * `cid` (component id), runs the handleEvent => render lifecycle,
   * saves the updated state of the component and returns the Parts "tree" to be
   * sent back to the client.
   *
   * @param cid the component id from the client event
   * @param event the event from the client
   * @returns the Parts "tree" to be sent back to the client
   */
  async handleEvent(cid: number, event: AnyLiveEvent): Promise<Parts> {
    // TODO - reimplement LiveComponent
    // handleLiveComponentEvent()
    // console.log("LiveComponent event", type, cid, event, value);
    // find stateful component data by cid
    const state = this.findState(cid);
    if (state === undefined) {
      throw new Error(`Could not find component for cid:${cid}`);
    }
    const { context, parts, id } = state;
    const c = this.findComponent(id);
    if (!c) {
      throw new Error(`Could not find component for id:${id}, cid:${cid}`);
    }

    const socket = this.newSocket(structuredClone(context) as LiveContext);
    // check for handleEvent and call it if it exists
    if (!c.handleEvent) {
      // istanbul ignore next
      console.warn(`LiveComponent with cid:${cid} has not implemented handleEvent() method`);
    } else {
      // run handleEvent and render then update context for cid
      await c.handleEvent(event, socket);
    }

    // re-render component
    const newView = await c.render(socket.context, { myself: cid });
    const newParts = newView.partsTree(true);

    // store state for subsequent loads
    this.saveState(id, {
      ...state,
      context: socket.context,
      parts: newParts,
    });

    //diff the new view with the old view
    const diff = deepDiff(parts, newParts);
    return {
      c: {
        // use cid to identify component to update
        [`${cid}`]: diff,
      },
    };
  }

  private findComponent(id: string): LiveComponent | undefined {
    const state = this.#idToState[id];
    if (state) {
      return this.#hashToComponent[state.hash];
    }
    return undefined;
  }
  private saveComponent<TContext extends AnyLiveContext>(hash: string, component: LiveComponent<TContext>): void {
    if (!this.#hashToComponent[hash]) {
      this.#hashToComponent[hash] = component;
    }
  }

  private findState(cid: number): LiveComponentState | undefined {
    return Object.values(this.#idToState).find((state) => state.cid === cid);
  }

  private saveState(id: string, state: LiveComponentState): void {
    this.#idToState[id] = state;
  }

  private newSocket<TContext extends LiveContext = AnyLiveContext>(context: TContext) {
    return new WsLiveComponentSocket(
      this.#joinId,
      context,
      (info) => this.#onSendInfo(info),
      (event) => this.#onPushEvent(event)
    );
  }

  private nextCid() {
    return this.#cidIndex++;
  }
}
