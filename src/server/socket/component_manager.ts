import { SessionData } from "express-session";
import jwt from 'jsonwebtoken';
import { WebSocket } from "ws";
import { HtmlSafeString, LiveComponent, LiveComponentSocket, LiveViewMetadata, LiveViewSocket, LiveViewTemplate, Parts } from "..";
import { LiveViewComponent, PushPatchPathAndParams } from "../";
import { PubSub } from "../pubsub/SingleProcessPubSub";
import { deepDiff } from "../templates/diff";
import { PhxMessage } from "./message_router";
import { PhxBlurPayload, PhxClickPayload, PhxDiffReply, PhxFocusPayload, PhxFormPayload, PhxHeartbeatIncoming, PhxHookPayload, PhxIncomingMessage, PhxJoinIncoming, PhxKeyDownPayload, PhxKeyUpPayload, PhxLivePatchIncoming, PhxOutgoingLivePatchPush, PhxOutgoingMessage } from "./types";
import { newHeartbeatReply, newPhxReply } from "./util";

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
  private subscriptionIds: Record<string,Promise<string>> = {};

  private context: unknown;
  private component: LiveViewComponent<unknown, unknown>;
  private signingSecret: string;
  private intervals: NodeJS.Timeout[] = [];
  private lastHeartbeat: number = Date.now();

  private csrfToken?: string;

  private _pageTitle: string | undefined;
  private pageTitleChanged: boolean = false;

  constructor(component: LiveViewComponent<unknown, unknown>, signingSecret: string, connectionId: string, ws: WebSocket) {
    this.component = component;
    this.signingSecret = signingSecret;
    this.context = {};
    this.connectionId = connectionId;
    this.ws = ws;
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

    let session: Omit<SessionData, "cookie">;
    try {
      session = jwt.verify(payloadSession, this.signingSecret) as Omit<SessionData, "cookie">;
      // compare sesison csrfToken with csrfToken from payload
      if (session.csrfToken !== this.csrfToken) {
        // if session csrfToken does not match payload csrfToken, reject join
        console.error("Rejecting join due to mismatched csrfTokens", session.csrfToken, this.csrfToken);
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

    // pass in phx_join payload params, session, and socket
    this.context = await this.component.mount(payloadParams, session, this.buildLiveViewSocket());

    this.context = await this.component.handleParams(urlParams, joinUrl!, this.buildLiveViewSocket());

    const view = await this.component.render(this.context, this.defaultLiveViewMeta());

    let rendered = this.maybeAddLiveComponentsToParts(view.partsTree());

    rendered = this.maybeAddPageTitleToParts(rendered);



    // send full view parts (statics & dynaimcs back)
    const replyPayload = {
      response: {
        rendered
      },
      status: "ok"
    }

    this.sendPhxReply(newPhxReply(message, replyPayload));
  }

  public async handleSubscriptions(phxMessage: PhxMessage) {
    // console.log("handleSubscriptions", this.connectionId, this.socketId, phxMessage);
    const { type } = phxMessage;
    if(type === "heartbeat") {
      this.onHeartbeat(phxMessage.message);
    } else if(type === "event") {
      await this.onEvent(phxMessage.message);
    } else if(type === "live_patch") {
      await this.onLivePatch(phxMessage.message);
    } else if(type === "phx_leave") {
      this.onPhxLeave(phxMessage.message);
    } else {
      console.error("Unknown message type", type, phxMessage, " on connectionId:", this.connectionId, " socketId:", this.joinId);
    }
  }

  public async onEvent(message: PhxIncomingMessage<PhxClickPayload | PhxFormPayload | PhxKeyUpPayload | PhxKeyDownPayload | PhxBlurPayload | PhxFocusPayload | PhxHookPayload>) {
    const [joinRef, messageRef, topic, _, payload] = message;
    const { type, event } = payload;

    // click and form events have different value in their payload
    // TODO - handle uploads
    let value: unknown;
    if (type === "click") {
      value = payload.value;
    } else if (type === "form") {
      // @ts-ignore - URLSearchParams has an entries method but not typed
      value = Object.fromEntries(new URLSearchParams(payload.value))
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

    if (isEventHandler(this.component)) {
      const previousContext = this.context;
      // @ts-ignore - already checked if handleEvent is defined
      this.context = await this.component.handleEvent(
        event,
        value,
        this.buildLiveViewSocket()
      );

      // get old render tree and new render tree for diffing
      const oldView = await this.component.render(previousContext, this.defaultLiveViewMeta());
      const view = await this.component.render(this.context, this.defaultLiveViewMeta());

      const combined = deepDiff(oldView.partsTree(), view.partsTree());
      const diff = this.maybeAddPageTitleToParts(combined);

      const replyPayload = {
        response: {
          diff
        },
        status: "ok"
      }

      this.sendPhxReply(newPhxReply(message, replyPayload));
    }
    else {
      console.error("no handleEvent method in component. add handleEvent method in your component to fix this error");
      return;
    }

  }

  public async onLivePatch(message: PhxLivePatchIncoming) {
    const [joinRef, messageRef, topic, event, payload] = message;

    const { url: urlString } = payload;
    const url = new URL(urlString);
    // @ts-ignore - URLSearchParams has an entries method but not typed
    const params = Object.fromEntries(url.searchParams);

    const previousContext = this.context;
    this.context = await this.component.handleParams(
      params,
      urlString,
      this.buildLiveViewSocket()
    );

    // get old render tree and new render tree for diffing
    const oldView = await this.component.render(previousContext, this.defaultLiveViewMeta());
    const view = await this.component.render(this.context, this.defaultLiveViewMeta());

    // TODO - why is the diff causing live_patch to fail??
    // const diff = deepDiff(oldView.partsTree(), view.partsTree());
    const diff = this.maybeAddPageTitleToParts(view.partsTree(false));

    const replyPayload = {
      response: {
        diff
      },
      status: "ok"
    }

    this.sendPhxReply(newPhxReply(message, replyPayload));
  }

  public onHeartbeat(message: PhxHeartbeatIncoming) {
    // TODO - monitor lastHeartbeat and shutdown if it's been too long?
    this.lastHeartbeat = Date.now();
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
    Object.entries(this.subscriptionIds).forEach(async([topic, subscriptionId]) => {
      const subId = await subscriptionId;
      await PubSub.unsubscribe(topic, subId);
    });

    // clear intervals
    this.intervals.forEach(clearInterval);
  }

  private async onPushPatch(patch: PushPatchPathAndParams) {
    const urlParams = new URLSearchParams(patch.to.params);
    const to = `${patch.to.path}?${urlParams}`
    const message: PhxOutgoingLivePatchPush = [
      null, // no join reference
      null, // no message reference
      this.joinId,
      "live_patch",
      { kind: "push", to }
    ]

    // @ts-ignore - URLSearchParams has an entries method but not typed
    const params = Object.fromEntries(urlParams);

    this.context = await this.component.handleParams(params, to, this.buildLiveViewSocket());

    this.sendPhxReply(message);
  }

  private async sendInternal(event: any): Promise<void> {
    // console.log("sendInternal", event, this.socketId);

    if (isInfoHandler(this.component)) {
      const previousContext = this.context;
      // @ts-ignore - already checked if handleInfo is defined
      this.context = this.component.handleInfo(event, this.buildLiveViewSocket());

      // get old render tree and new render tree for diffing
      const oldView = await this.component.render(previousContext, this.defaultLiveViewMeta());
      const view = await this.component.render(this.context, this.defaultLiveViewMeta());

      const combined = deepDiff(oldView.partsTree(), view.partsTree());
      const diff = this.maybeAddPageTitleToParts(combined);

      const reply: PhxDiffReply = [
        null, // no join reference
        null, // no message reference
        this.joinId,
        "diff",
        diff
      ]
      this.sendPhxReply(reply);
    }
    else {
      console.error("received internal event but no handleInfo in component", this.component);
    }
  }

  private buildLiveViewSocket(): LiveViewSocket<unknown> {
    return {
      id: this.joinId,
      connected: true, // websocket is connected
      ws: this.ws, // the websocket TODO necessary?
      context: this.context,
      sendInternal: (event) => this.sendInternal(event),
      repeat: (fn, intervalMillis) => this.repeat(fn, intervalMillis),
      pageTitle: (newTitle: string) => { this.pageTitle = newTitle },
      subscribe: (topic: string) => {
        const subId = PubSub.subscribe(topic, (event) => this.sendInternal(event))
        this.subscriptionIds[topic] = subId;
      },
      pushPatch: (params: PushPatchPathAndParams) => {
        this.onPushPatch(params);
      }
    }
  }

  private set pageTitle(newTitle: string) {
    if (this._pageTitle !== newTitle) {
      this._pageTitle = newTitle;
      this.pageTitleChanged = true;
    }
  }

  private maybeAddPageTitleToParts(parts: Parts) {
    if (this.pageTitleChanged) {
      this.pageTitleChanged = false; // reset
      return {
        ...parts,
        t: this._pageTitle
      }
    }
    return parts;
  }

  private handleError(reply: PhxOutgoingMessage<any>, err?: Error) {
    if (err) {
      this.shutdown();
      console.error(`socket readystate:${this.ws.readyState}. Shutting down topic:${reply[2]}. For component:${this.component}. Error: ${err}`);
    }
  }

  private sendPhxReply(reply: PhxOutgoingMessage<any>) {
    this.ws.send(JSON.stringify(reply), { binary: false }, (err?: Error) => this.handleError(reply, err));
  }


  /**
   * Map for stateful components where key is a compound id `${componentName}_${componentId}`
   * and value is a tuple of [context, renderedPartsTree, changed].
   *
   * We are using a Map here because it is sorted in insertion order.
   */
  private statefulLiveComponents: Map<string, [unknown, Parts, boolean]> = new Map();
  private statelessLiveComponents: Map<string, Parts> = new Map();

  /**
   * Collect all the LiveComponents first, group by their component type (e.g. instanceof),
   * then run single preload for all components of same type. then run rest of lifecycle
   * based on stateless or stateful.
   * @param liveComponent
   * @param params
   */
  private async liveComponentProcessor(liveComponent: LiveComponent<unknown>, params: unknown & {id? : string}): Promise<LiveViewTemplate> {
    console.log("liveComponentProcessor", liveComponent, params);
    // TODO - determine how to collect all the live components of the same type
    // and preload them all at once
    // Can get the types by `liveComponent.constructor.name` but
    // unclear how to determine if all the `live_component` tags have
    // been processed...  Perhaps `Parts` can track this?

    const { id } = params;
    delete params.id; // remove id from param to use as default context
    const componentType = liveComponent.constructor.name;

    // setup variables
    let context: unknown = params;
    let newView: LiveViewTemplate;

    // determine if component is stateful or stateless
    if(id !== undefined) {
      console.log("id", id)
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
      const compoundId = `${componentType}_${id}`;
      if(this.statefulLiveComponents.get(compoundId) === undefined) {
        // first load lifecycle
        context = await liveComponent.mount(this.buildLiveComponentSocket(context));
        context = await liveComponent.update(context, this.buildLiveComponentSocket(context));

        // no old view so just send render as diff
        newView = await liveComponent.render(context, {myself: id});

        // store state for subsequent loads
        this.statefulLiveComponents.set(compoundId, [context, newView.partsTree(), true]);
      } else {
        // store state for subsequent loads
        const [oldContext, oldParts, _] = this.statefulLiveComponents.get(compoundId)!;

        // subsequent loads lifecycle
        context = await liveComponent.update(oldContext, this.buildLiveComponentSocket(oldContext));

        // no old view so just send render as diff
        newView = await liveComponent.render(context, {myself: id});
        const newParts = deepDiff(oldParts, newView.partsTree());
        const changed = Object.keys(newParts).length > 0;
        // store state for subsequent loads
        this.statefulLiveComponents.set(compoundId, [context, newParts, changed]);
      }
      // since stateful components are sent back as part of the render
      // tree (under the `c` key) we return an empty template here
      return new HtmlSafeString(["1"], [], true);
    }
    else {
      console.log("stateless", context)
      // stateless `LiveComponent`
      // lifecycle is:
      // 1. preload
      // 2. mount
      // 3. update
      // 4. render

      // skipping preload for now... see comment above
      context = await liveComponent.mount(this.buildLiveComponentSocket(context));
      context = await liveComponent.update(context, this.buildLiveComponentSocket(context));
      // no old view so just render
      newView = await liveComponent.render(context, {myself: id});
      // since this is stateless send back the LiveViewTemplate
      return newView;
    }
  }

  private maybeAddLiveComponentsToParts(parts: Parts) {
    const changedParts: Parts = {}
    let index = 1;
    // iterate over stateful components to find changed
    for(const [compoundId, [context, partsTree, changed]] of this.statefulLiveComponents) {
      if(changed) {
        changedParts[`${index}`] = partsTree;
      }
      index++;
    }
    // if any stateful component changed
    if (Object.keys(changedParts).length > 0) {
      // reset changed by setting all changed to false
      this.statefulLiveComponents.forEach(([context, parts, changed], id) => {
        this.statefulLiveComponents.set(id, [context, parts, false]);
      })

      // return parts with changed LiveComponents
      return {
        ...parts,
        c: changedParts
      }
    }
    return parts;
  }

  private defaultLiveViewMeta(): LiveViewMetadata {
    return {
      csrfToken: this.csrfToken,
      live_component: async(liveComponent, params) => {
        const render = await this.liveComponentProcessor(liveComponent, params);
        return render;
      }
    } as LiveViewMetadata
  }

  private buildLiveComponentSocket(context: unknown): LiveComponentSocket<unknown> {
    return {
      id: this.joinId,
      connected: true, // websocket is connected
      ws: this.ws, // the websocket TODO necessary?
      context,
      send: (event) => this.sendInternal(event),
    }
  }

}

export function isInfoHandler(component: LiveViewComponent<unknown, unknown>) {
  return "handleInfo" in component;
}

export function isEventHandler(component: LiveViewComponent<unknown, unknown>) {
  return "handleEvent" in component;
}

