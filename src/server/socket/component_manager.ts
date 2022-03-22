import { SessionData } from "express-session";
import { fromJS } from "immutable";
import jwt from "jsonwebtoken";
import { WebSocket } from "ws";
import { HtmlSafeString, LiveComponent, LiveViewMeta, LiveViewTemplate, Parts } from "..";
import { LiveView } from "../";
import { LiveComponentContext, LiveViewContext, WsLiveComponentSocket } from "../component";
import { Flash } from "../component/flash";
import { PubSub } from "../pubsub/SingleProcessPubSub";
import { deepDiff } from "../templates/diff";
import { WsLiveViewSocket } from "./live_socket";
import { PhxMessage } from "./message_router";
import {
  PhxBlurPayload,
  PhxClickPayload,
  PhxDiffReply,
  PhxFocusPayload,
  PhxFormPayload,
  PhxHeartbeatIncoming,
  PhxHookPayload,
  PhxIncomingMessage,
  PhxJoinIncoming,
  PhxKeyDownPayload,
  PhxKeyUpPayload,
  PhxLivePatchIncoming,
  PhxOutgoingLivePatchPush,
  PhxOutgoingMessage,
} from "./types";
import { newHeartbeatReply, newPhxReply } from "./util";

/**
 * Data kept for each `LiveComponent` instance.
 */
interface StatefulLiveComponentData<Context extends LiveComponentContext> {
  /**
   * compoundId (`${componentType}_${providedComponentId}`) of the component which is used to uniquely identify it
   * across the entire application.
   */
  compoundId: string;
  /**
   * The last calculated state of the component.
   */
  context: Context;
  /**
   * The last `Parts` tree rendered by the component.
   */
  parts: Parts;
  /**
   * Whether the component changed between the last two `render` calls and
   * therefore should be rerendered.
   */
  changed: boolean;
  /**
   * The internal componentId as calculated by the component manager as an
   * index into when the component was parsed via render.
   */
  cid: number;
  /**
   * The class name of the component, used for grouping components of the
   * same type together and running `handleEvent`s.
   */
  componentClass: string;
}

/**
 * The `LiveViewComponentManager` is responsible for managing the lifecycle of a `LiveViewComponent`
 * including routing of events, the state (i.e. context), and other aspects of the component.  The
 * `MessageRouter` is responsible for routing messages to the appropriate `LiveViewComponentManager`
 * based on the topic on the incoming socket messages.
 */
export class LiveViewComponentManager {
  private connectionId: string;
  private joinId: string;
  private ws: WebSocket;
  private subscriptionIds: Record<string, Promise<string>> = {};

  private liveView: LiveView<LiveViewContext, unknown>;
  private signingSecret: string;
  private intervals: NodeJS.Timeout[] = [];
  private session: SessionData;

  private csrfToken?: string;

  private _events: { event: string; value: Record<string, any> }[] = [];
  private eventAdded: boolean = false;

  private _pageTitle: string | undefined;
  private pageTitleChanged: boolean = false;

  private socket: WsLiveViewSocket<LiveViewContext>;
  private liveViewRootTemplate?: (sessionData: SessionData, inner_content: HtmlSafeString) => HtmlSafeString;

  constructor(
    component: LiveView<LiveViewContext, unknown>,
    signingSecret: string,
    connectionId: string,
    ws: WebSocket,
    liveViewRootTemplate?: (sessionData: SessionData, inner_content: HtmlSafeString) => HtmlSafeString
  ) {
    this.liveView = component;
    this.signingSecret = signingSecret;
    this.connectionId = connectionId;
    this.ws = ws;
    this.liveViewRootTemplate = liveViewRootTemplate;

    // subscribe to events on connectionId which should just be
    // heartbeat messages
    const subId = PubSub.subscribe(connectionId, (data) => this.handleSubscriptions(data as PhxMessage));
    // save subscription id for unsubscribing
    this.subscriptionIds[connectionId] = subId;
  }

  async handleJoin(message: PhxJoinIncoming) {
    const [joinRef, messageRef, topic, event, payload] = message;
    const { url: urlString, redirect: redirectString } = payload;
    const joinUrl = urlString || redirectString;
    // checked one of these was defined in MessageRouter
    const url = new URL(joinUrl!);
    // @ts-ignore
    const urlParams = Object.fromEntries(url.searchParams);

    // extract params, session and socket from payload
    const { params: payloadParams, session: payloadSession, static: payloadStatic } = payload;
    // set component manager csfr token
    this.csrfToken = payloadParams._csrf_token;

    try {
      this.session = jwt.verify(payloadSession, this.signingSecret) as SessionData;
      this.session.flash = new Flash(Object.entries(this.session.flash || {}));

      // compare sesison csrfToken with csrfToken from payload
      if (this.session.csrfToken !== this.csrfToken) {
        // if session csrfToken does not match payload csrfToken, reject join
        console.error("Rejecting join due to mismatched csrfTokens", this.session.csrfToken, this.csrfToken);
        return;
      }
    } catch (e) {
      console.error("Error decoding session", e);
      return;
    }

    this.joinId = topic;
    // subscribe to events on the socketId which includes
    // events, live_patch, and phx_leave messages
    const subId = PubSub.subscribe(this.joinId, (data) => this.handleSubscriptions(data as PhxMessage));
    // again save subscription id for unsubscribing
    this.subscriptionIds[this.joinId] = subId;

    // create the liveViewSocket now
    this.socket = this.newLiveViewSocket();

    // initial lifecycle steps mount => handleParams => render
    await this.liveView.mount(payloadParams, this.session, this.socket);
    await this.liveView.handleParams(urlParams, joinUrl!, this.socket);
    let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());

    // wrap in root template if there is one
    view = await this.maybeWrapInRootTemplate(view);

    // add `LiveComponent` to the render tree
    let rendered = this.maybeAddLiveComponentsToParts(view.partsTree());

    // change the page title if it has been set
    rendered = this.maybeAddPageTitleToParts(rendered);
    rendered = this.maybeAddEventsToParts(rendered);

    // send full view parts (statics & dynaimcs back)
    const replyPayload = {
      response: {
        rendered,
      },
      status: "ok",
    };

    this.sendPhxReply(newPhxReply(message, replyPayload));

    // remove temp data
    this.socket.updateContextWithTempAssigns();
  }

  public async handleSubscriptions(phxMessage: PhxMessage) {
    // console.log("handleSubscriptions", this.connectionId, this.socketId, phxMessage);
    const { type } = phxMessage;
    if (type === "heartbeat") {
      this.onHeartbeat(phxMessage.message);
    } else if (type === "event") {
      await this.onEvent(phxMessage.message);
    } else if (type === "live_patch") {
      await this.onLivePatch(phxMessage.message);
    } else if (type === "phx_leave") {
      this.onPhxLeave(phxMessage.message);
    } else {
      console.error(
        "Unknown message type",
        type,
        phxMessage,
        " on connectionId:",
        this.connectionId,
        " socketId:",
        this.joinId
      );
    }
  }

  public async onEvent(
    message: PhxIncomingMessage<
      | PhxClickPayload
      | PhxFormPayload
      | PhxKeyUpPayload
      | PhxKeyDownPayload
      | PhxBlurPayload
      | PhxFocusPayload
      | PhxHookPayload
    >
  ) {
    const [joinRef, messageRef, topic, _, payload] = message;
    const { type, event, cid } = payload;

    // click and form events have different value in their payload
    // TODO - handle uploads
    let value: unknown;
    if (type === "click") {
      value = payload.value;
    } else if (type === "form") {
      // @ts-ignore - URLSearchParams has an entries method but not typed
      value = Object.fromEntries(new URLSearchParams(payload.value));
      // TODO - check value for _csrf_token here from phx_submit and validate against session csrf?
      // TODO - check for _target variable from phx_change here and remove it from value?
    } else if (type === "keyup" || type === "keydown") {
      value = payload.value;
    } else if (type === "blur" || type === "focus") {
      value = payload.value;
    } else if (type === "hook") {
      value = payload.value;
    } else {
      console.error("Unknown event type", type);
      return;
    }

    // determine if event is for `LiveComponent`
    if (cid !== undefined) {
      // console.log("LiveComponent event", type, cid, event, value);
      // find stateful component data by cid
      const statefulComponent = Object.values(this.statefulLiveComponents).find((c) => c.cid === cid);
      if (statefulComponent) {
        const { componentClass, context: oldContext, parts: oldParts, compoundId } = statefulComponent;
        // call event handler on stateful component instance
        const liveComponent = this.statefuleLiveComponentInstances[componentClass];
        if (liveComponent) {
          // socker for this live component instance
          const lcSocket = this.newLiveComponentSocket({ ...oldContext });

          // run handleEvent and render then update context for cid
          await liveComponent.handleEvent(event, value as Record<string, string>, lcSocket);

          // TODO optimization - if contexts are the same, don't re-render
          const newView = await liveComponent.render(lcSocket.context, { myself: cid });

          //
          const newParts = deepDiff(oldParts, newView.partsTree());
          const changed = Object.keys(newParts).length > 0;
          // store state for subsequent loads
          this.statefulLiveComponents[compoundId] = {
            ...statefulComponent,
            context: lcSocket.context,
            parts: newView.partsTree(),
            changed,
          };

          let diff: Parts = {
            c: {
              // use cid to identify component to update
              [`${cid}`]: newParts,
            },
          };

          diff = this.maybeAddEventsToParts(diff);

          // send message to re-render
          const replyPayload = {
            response: {
              diff,
            },
            status: "ok",
          };

          this.sendPhxReply(newPhxReply(message, replyPayload));
        } else {
          // not sure how we'd get here but just in case - ignore test coverage though
          /* istanbul ignore next */
          console.error("Could not find stateful component instance for", componentClass);
        }
      } else {
        console.error("Could not find stateful component for", cid);
      }
    }
    // event is not for LiveComponent rather it is for LiveView
    else {
      // console.log("LiveView event", type, event, value);
      if (isEventHandler(this.liveView) || event === "lv:clear-flash") {
        // copy previous context
        const previousContext = { ...this.socket.context };

        // check again because event could be a lv:clear-flash
        if (isEventHandler(this.liveView)) {
          // @ts-ignore - already checked if handleEvent is defined
          await this.liveView.handleEvent(event, value, this.socket);
        }

        const ctxEqual = areContextsValueEqual(previousContext, this.socket.context);
        let diff: Parts = {};

        // only calc diff if contexts have changed
        if (!ctxEqual || event === "lv:clear-flash") {
          // get old render tree and new render tree for diffing
          const oldView = await this.liveView.render(previousContext, this.defaultLiveViewMeta());
          let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());

          // wrap in root template if there is one
          view = await this.maybeWrapInRootTemplate(view);

          diff = deepDiff(oldView.partsTree(), view.partsTree());
        }

        diff = this.maybeAddPageTitleToParts(diff);
        diff = this.maybeAddEventsToParts(diff);

        const replyPayload = {
          response: {
            diff,
          },
          status: "ok",
        };

        this.sendPhxReply(newPhxReply(message, replyPayload));

        // remove temp data
        this.socket.updateContextWithTempAssigns();
      } else {
        console.error("no handleEvent method in component. add handleEvent method in your component to fix this error");
        return;
      }
    }
  }

  public async onLivePatch(message: PhxLivePatchIncoming) {
    const [joinRef, messageRef, topic, event, payload] = message;

    const { url: urlString } = payload;
    const url = new URL(urlString);
    // @ts-ignore - URLSearchParams has an entries method but not typed
    const params = Object.fromEntries(url.searchParams);

    const previousContext = this.socket.context;
    await this.liveView.handleParams(params, urlString, this.socket);

    // get old render tree and new render tree for diffing
    // const oldView = await this.component.render(previousContext, this.defaultLiveViewMeta());
    let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());

    // wrap in root template if there is one
    view = await this.maybeWrapInRootTemplate(view);

    // TODO - why is the diff causing live_patch to fail??
    // const diff = deepDiff(oldView.partsTree(), view.partsTree());
    let diff = this.maybeAddPageTitleToParts(view.partsTree(false));
    diff = this.maybeAddEventsToParts(diff);

    const replyPayload = {
      response: {
        diff,
      },
      status: "ok",
    };

    this.sendPhxReply(newPhxReply(message, replyPayload));

    // remove temp data
    this.socket.updateContextWithTempAssigns();
  }

  public onHeartbeat(message: PhxHeartbeatIncoming) {
    // TODO - monitor lastHeartbeat and shutdown if it's been too long?
    this.sendPhxReply(newHeartbeatReply(message));
  }

  public async onPhxLeave(message: PhxIncomingMessage<{}>) {
    await this.shutdown();
  }

  public repeat(fn: () => void, intervalMillis: number) {
    this.intervals.push(setInterval(fn, intervalMillis));
  }

  public async shutdown() {
    // unsubscribe from PubSubs
    Object.entries(this.subscriptionIds).forEach(async ([topic, subscriptionId]) => {
      const subId = await subscriptionId;
      await PubSub.unsubscribe(topic, subId);
    });

    // clear intervals
    this.intervals.forEach(clearInterval);
  }

  private async onPushPatch(path: string, params?: Record<string, string | number>, replaceHistory: boolean = false) {
    this.onPushNavigation("live_patch", path, params, replaceHistory);
  }

  private async onPushRedirect(
    path: string,
    params?: Record<string, string | number>,
    replaceHistory: boolean = false
  ) {
    this.onPushNavigation("live_redirect", path, params, replaceHistory);
  }

  private async onPushNavigation(
    navEvent: "live_redirect" | "live_patch",
    path: string,
    params?: Record<string, string | number>,
    replaceHistory: boolean = false
  ) {
    // make params into query string
    let stringParams: string | undefined;
    const urlParams = new URLSearchParams();
    if (params && Object.keys(params).length > 0) {
      for (const [key, value] of Object.entries(params)) {
        urlParams.set(key, String(value));
      }
      stringParams = urlParams.toString();
    }

    const to = stringParams ? `${path}?${stringParams}` : path;
    const kind = replaceHistory ? "replace" : "push";
    const message: PhxOutgoingLivePatchPush = [
      null, // no join reference
      null, // no message reference
      this.joinId,
      navEvent,
      { kind, to },
    ];

    // @ts-ignore - URLSearchParams has an entries method but not typed
    const searchParams = Object.fromEntries(urlParams);

    await this.liveView.handleParams(searchParams, to, this.socket);

    this.sendPhxReply(message);

    // remove temp data
    this.socket.updateContextWithTempAssigns();
  }

  private async onPushEvent(event: string, value: Record<string, any>) {
    // queue event for sending
    this._events.push({ event, value });
    this.eventAdded = true;
  }

  private putFlash(key: string, value: string) {
    this.session.flash.set(key, value);
  }

  private async sendInternal(event: any): Promise<void> {
    // console.log("sendInternal", event, this.socketId);

    if (isInfoHandler(this.liveView)) {
      const previousContext = this.socket.context;
      // @ts-ignore - already checked if handleInfo is defined
      this.liveView.handleInfo(event, this.socket);

      const ctxEqual = areContextsValueEqual(previousContext, this.socket.context);
      let diff: Parts = {};
      // only calc diff if contexts have changed
      if (!ctxEqual) {
        // get old render tree and new render tree for diffing
        const oldView = await this.liveView.render(previousContext, this.defaultLiveViewMeta());
        let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());

        // wrap in root template if there is one
        view = await this.maybeWrapInRootTemplate(view);

        diff = deepDiff(oldView.partsTree(), view.partsTree());
      }
      diff = this.maybeAddPageTitleToParts(diff);
      diff = this.maybeAddEventsToParts(diff);

      const reply: PhxDiffReply = [
        null, // no join reference
        null, // no message reference
        this.joinId,
        "diff",
        diff,
      ];
      this.sendPhxReply(reply);

      // remove temp data
      this.socket.updateContextWithTempAssigns();
    } else {
      console.error("received internal event but no handleInfo in component", this.liveView);
    }
  }

  private set pageTitle(newTitle: string) {
    if (this._pageTitle !== newTitle) {
      this._pageTitle = newTitle;
      this.pageTitleChanged = true;
    }
  }

  private async maybeWrapInRootTemplate(view: HtmlSafeString) {
    if (this.liveViewRootTemplate) {
      return await this.liveViewRootTemplate(this.session, view);
    }
    return view;
  }

  private maybeAddPageTitleToParts(parts: Parts) {
    if (this.pageTitleChanged) {
      this.pageTitleChanged = false; // reset
      return {
        ...parts,
        t: this._pageTitle,
      };
    }
    return parts;
  }

  private maybeAddEventsToParts(parts: Parts) {
    if (this.eventAdded) {
      this.eventAdded = false; // reset
      const e = [...this._events.map(({ event, value }) => [event, value])];
      this._events = []; // reset
      return {
        ...parts,
        e,
      };
    }
    return parts;
  }

  private handleError(reply: PhxOutgoingMessage<any>, err?: Error) {
    if (err) {
      this.shutdown();
      console.error(
        `socket readystate:${this.ws.readyState}. Shutting down topic:${reply[2]}. For component:${this.liveView}. Error: ${err}`
      );
    }
  }

  private sendPhxReply(reply: PhxOutgoingMessage<any>) {
    this.ws.send(JSON.stringify(reply), { binary: false }, (err?: Error) => this.handleError(reply, err));
  }

  /**
   * Records for stateful components where key is a compound id `${componentName}_${componentId}`
   * and value is a tuple of [context, renderedPartsTree, changed, myself].
   *
   */
  private statefulLiveComponents: Record<string, StatefulLiveComponentData<LiveComponentContext>> = {};

  private statefuleLiveComponentInstances: Record<string, LiveComponent<any>> = {};

  /**
   * Collect all the LiveComponents first, group by their component type (e.g. instanceof),
   * then run single preload for all components of same type. then run rest of lifecycle
   * based on stateless or stateful.
   * @param liveComponent
   * @param params
   */
  private async liveComponentProcessor<Context extends LiveComponentContext>(
    liveComponent: LiveComponent<Context>,
    params: Partial<Context & { id?: number | string }> = {} as Context
  ): Promise<LiveViewTemplate> {
    // console.log("liveComponentProcessor", liveComponent, params);
    // TODO - determine how to collect all the live components of the same type
    // and preload them all at once
    // Can get the types by `liveComponent.constructor.name` but
    // unclear how to determine if all the `live_component` tags have
    // been processed...  Perhaps `Parts` can track this?

    const { id } = params;
    delete params.id; // remove id from param to use as default context
    const componentClass = liveComponent.constructor.name;

    // cache single instance of each component type
    if (!this.statefuleLiveComponentInstances[componentClass]) {
      this.statefuleLiveComponentInstances[componentClass] = liveComponent;
    }

    // setup variables
    let context: Partial<Context> = { ...params };
    let newView: LiveViewTemplate;

    // determine if component is stateful or stateless
    if (id !== undefined) {
      // stateful `LiveComponent`
      // lifecycle is:
      //   On First Load:
      //   1. preload
      //   2. mount
      //   3. update
      //   4. render
      //   On Subsequent Loads:
      //   1. update
      //   2. render
      //   On Events:
      //   1. handleEvent
      //   2. render
      const compoundId = `${componentClass}_${id}`;
      let myself: number;
      if (this.statefulLiveComponents[compoundId] === undefined) {
        myself = Object.keys(this.statefulLiveComponents).length + 1;

        // setup socket
        const lcSocket = this.newLiveComponentSocket({ ...context } as Context);

        // first load lifecycle mount => update => render
        await liveComponent.mount(lcSocket);
        await liveComponent.update(lcSocket);
        newView = await liveComponent.render(lcSocket.context, { myself });

        // store state for subsequent loads
        this.statefulLiveComponents[compoundId] = {
          context: lcSocket.context,
          parts: newView.partsTree(),
          changed: true,
          cid: myself,
          componentClass,
          compoundId,
        };
      } else {
        // subsequent loads lifecycle update => render
        // get state for this load
        const liveComponentData = this.statefulLiveComponents[compoundId];
        const { context: oldContext, parts: oldParts, cid } = liveComponentData;
        myself = cid;

        // setup socket
        const lcSocket = this.newLiveComponentSocket<Context>({ ...oldContext } as Context);

        // subsequent loads lifecycle update => render (no mount)
        await liveComponent.update(lcSocket);
        newView = await liveComponent.render(lcSocket.context, { myself });

        const newParts = deepDiff(oldParts, newView.partsTree());
        const changed = Object.keys(newParts).length > 0;

        // store state for subsequent loads
        this.statefulLiveComponents[compoundId] = {
          ...liveComponentData,
          context: lcSocket.context,
          parts: newView.partsTree(),
          changed,
        };
      }
      // since stateful components are sent back as part of the render
      // tree (under the `c` key) we return an empty template here
      return new HtmlSafeString([String(myself)], [], true);
    } else {
      // stateless `LiveComponent`
      // lifecycle is:
      // 1. preload
      // 2. mount
      // 3. update
      // 4. render

      // setup socket
      const lcSocket = this.newLiveComponentSocket<Context>({ ...context } as Context);

      // skipping preload for now... see comment above
      // first load lifecycle mount => update => render
      await liveComponent.mount(lcSocket);
      await liveComponent.update(lcSocket);
      newView = await liveComponent.render(lcSocket.context, { myself: id });
      // since this is stateless send back the LiveViewTemplate
      return newView;
    }
  }

  private maybeAddLiveComponentsToParts(parts: Parts) {
    const changedParts: Parts = {};
    // iterate over stateful components to find changed
    Object.values(this.statefulLiveComponents).forEach((componentData) => {
      if (componentData.changed) {
        const { cid, parts } = componentData;
        // changedParts key is the myself id
        changedParts[`${cid}`] = parts;
      }
    });
    // if any stateful component changed
    if (Object.keys(changedParts).length > 0) {
      // reset changed by setting all changed to false
      Object.keys(this.statefulLiveComponents).forEach((compoundId) => {
        this.statefulLiveComponents[compoundId].changed = false;
      });

      // return parts with changed LiveComponents
      return {
        ...parts,
        c: changedParts,
      };
    }
    return parts;
  }

  private defaultLiveViewMeta(): LiveViewMeta {
    return {
      csrfToken: this.csrfToken,
      live_component: async <Context extends LiveComponentContext>(
        liveComponent: LiveComponent<Context>,
        params?: Partial<Context & { id: string | number }> | undefined
      ): Promise<LiveViewTemplate> => {
        const render = await this.liveComponentProcessor<Context>(liveComponent, params);
        return render;
      },
    } as LiveViewMeta;
  }

  private newLiveViewSocket() {
    return new WsLiveViewSocket(
      this.joinId,
      (newTitle: string) => {
        this.pageTitle = newTitle;
      },
      (event, params) => this.onPushEvent(event, params),
      (path, params, replace) => this.onPushPatch(path, params, replace),
      (path, params, replace) => this.onPushRedirect(path, params, replace),
      (key, value) => this.putFlash(key, value),
      (fn, intervalMillis) => this.repeat(fn, intervalMillis),
      (event) => this.sendInternal(event),
      (topic: string) => {
        const subId = PubSub.subscribe(topic, (event) => this.sendInternal(event));
        this.subscriptionIds[topic] = subId;
      }
    );
  }

  private newLiveComponentSocket<Context extends LiveComponentContext>(context: Context) {
    return new WsLiveComponentSocket(
      this.joinId,
      context,
      (event) => this.sendInternal(event),
      (event, params) => this.onPushEvent(event, params)
    );
  }
}

export function isInfoHandler(component: LiveView<LiveViewContext, unknown>) {
  return "handleInfo" in component;
}

export function isEventHandler(component: LiveView<LiveViewContext, unknown>) {
  return "handleEvent" in component;
}

export function areContextsValueEqual(context1: LiveComponentContext, context2: LiveComponentContext): boolean {
  if (!!context1 && !!context2) {
    const c1 = fromJS(context1);
    const c2 = fromJS(context2);
    return c1.equals(c2);
  } else {
    return false;
  }
}
