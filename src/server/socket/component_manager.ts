import { WebSocket } from "ws";
import { LiveViewComponent, LiveViewSocket } from "..";
import { newHeartbeatReply, newPhxReply, PhxClickPayload, PhxFormPayload, PhxHeartbeatIncoming, PhxIncomingMessage, PhxJoinIncoming, PhxJoinPayload, PhxLivePatchIncoming, PhxOutgoingMessage } from "./types";
import jwt from 'jsonwebtoken';

export class LiveViewComponentManager {

  private context: unknown;
  private component: LiveViewComponent<unknown, unknown>;
  private topic: string;
  private signingSecret: string;

  constructor(component: LiveViewComponent<unknown, unknown>, signingSecret: string) {
    this.component = component;
    this.signingSecret = signingSecret;
    this.context = {};
  }

  handleJoin(ws: WebSocket, message: PhxJoinIncoming) {
    const [joinRef, messageRef, topic, event, payload] = message;
    const { url: urlString } = payload;
    const url = new URL(urlString);
    // @ts-ignore
    const urlParams = Object.fromEntries(url.searchParams);

    // extract params, session and socket from payload
    const { params: payloadParams, session: payloadSession, static: payloadStatic } = payload;

    // TODO - use session from cookie
    // const session = jwt.verify(payloadSession, this.signingSecret) as any;
    // console.log("session is", session);
    const session = {}

    const liveViewSocket: LiveViewSocket<unknown> = {
      id: topic,
      connected: true, // websocket is connected
      ws, // the websocket
      context: this.context
    }
    // pass in phx_join payload params, session, and socket
    this.context = this.component.mount(payloadParams, session, liveViewSocket);
    const ctx = this.component.handleParams(urlParams, urlString, liveViewSocket);
    // merge contexts
    if (typeof this.context === 'object' && typeof ctx === 'object' && Object.keys(ctx).length > 0) {
      this.context = { ...this.context, ...ctx };
    }

    const view = this.component.render(this.context);

    // send full view parts (statics & dynaimcs back)
    const replyPayload = {
      response: {
        rendered: view.partsTree()
      },
      status: "ok"
    }

    this.sendPhxReply(ws, newPhxReply(message, replyPayload));
  }

  onHeartbeat(ws: WebSocket, message: PhxHeartbeatIncoming) {
    // TODO keep track of last heartbeat and disconnect if no heartbeat for a while?
    this.sendPhxReply(ws, newHeartbeatReply(message));
  }

  onEvent(ws: WebSocket, message: PhxIncomingMessage<PhxClickPayload | PhxFormPayload>) {
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
    }

    if (isEventHandler(this.component)) {
      const phxSocket: LiveViewSocket<unknown> = {
        id: topic,
        connected: true, // websocket is connected
        ws, // the websocket
        context: this.context
      }
      // @ts-ignore - already checked if handleEvent is defined
      const ctx = this.component.handleEvent(event, value, phxSocket);
      // merge contexts
      if (typeof this.context === 'object' && typeof ctx === 'object' && Object.keys(ctx).length > 0) {
        this.context = { ...this.context, ...ctx };
      }

      const view = this.component.render(this.context);

      const replyPayload = {
        response: {
          diff: {
            ...view.partsTree(false)
          }
        },
        status: "ok"
      }

      this.sendPhxReply(ws, newPhxReply(message, replyPayload));
    }
    else {
      console.error("no handleEvent in component", this.component);
      return;
    }


  }

  onLivePatch(ws: WebSocket, message: PhxLivePatchIncoming) {
    const [joinRef, messageRef, topic, event, payload] = message;


    const { url: urlString } = payload;
    const url = new URL(urlString);
    // @ts-ignore - URLSearchParams has an entries method but not typed
    const params = Object.fromEntries(url.searchParams);

    const phxSocket: LiveViewSocket<unknown> = {
      id: topic,
      connected: true, // websocket is connected
      ws, // the websocket
      context: this.context
    }

    const ctx = this.component.handleParams(params, urlString, phxSocket);
    if (typeof this.context === 'object' && typeof ctx === 'object' && Object.keys(ctx).length > 0) {
      this.context = { ...this.context, ...ctx };
    }

    const view = this.component.render(this.context);

    const replyPayload = {
      response: {
        diff: {
          ...view.partsTree(false)
        }
      },
      status: "ok"
    }

    this.sendPhxReply(ws, newPhxReply(message, replyPayload));
  }


  sendPhxReply(ws: WebSocket, reply: PhxOutgoingMessage<any>) {
    ws.send(JSON.stringify(reply), { binary: false }, (err: any) => {
      if (err) {
        console.error("error", err);
      }
    });
  }

}

function isEventHandler(component: LiveViewComponent<unknown, unknown>) {
  return "handleEvent" in component;
}