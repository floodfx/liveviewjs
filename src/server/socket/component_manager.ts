import { WebSocket } from "ws";
import { LiveViewComponent, LiveViewSocket } from "..";
import { newHeartbeatReply, newPhxReply, PhxClickPayload, PhxDiffReply, PhxFormPayload, PhxHeartbeatIncoming, PhxIncomingMessage, PhxJoinIncoming, PhxJoinPayload, PhxLivePatchIncoming, PhxOutgoingMessage } from "./types";
import jwt from 'jsonwebtoken';
import { SessionData } from "express-session";

export class LiveViewComponentManager {

  private context: unknown;
  private component: LiveViewComponent<unknown, unknown>;
  private signingSecret: string;
  private intervals: NodeJS.Timeout[] = [];
  private lastHeartbeat: number = Date.now();
  private socketIsClosed: boolean = false;

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
    let session = {}
    try {
      session = jwt.verify(payloadSession, this.signingSecret) as Partial<SessionData>;
    } catch (e) {
      console.log("failed to decode session", e);
    }
    // TODO - check csfr token?
    // TODO - compare csfr token with session _csrf?

    const liveViewSocket = this.buildLiveViewSocket(ws, topic);
    // pass in phx_join payload params, session, and socket
    this.context = this.component.mount(payloadParams, session, liveViewSocket);

    // update socket with new context
    liveViewSocket.context = this.context;
    this.context = this.component.handleParams(urlParams, urlString, liveViewSocket);

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
    this.lastHeartbeat = Date.now();
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
      // @ts-ignore - already checked if handleEvent is defined
      this.context = this.component.handleEvent(event, value, this.buildLiveViewSocket(ws, topic));

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

    this.context = this.component.handleParams(params, urlString, this.buildLiveViewSocket(ws, topic));

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

  repeat(fn: () => void, intervalMillis: number) {
    this.intervals.push(setInterval(fn, intervalMillis));
  }

  shutdown() {
    this.intervals.forEach(clearInterval);
  }

  isHealthy() {
    if (this.socketIsClosed) {
      return false;
    } else {
      const now = Date.now();
      const diff = now - this.lastHeartbeat;
      return diff < 60000;
    }
  }

  private sendInternal(ws: WebSocket, event: any, topic: string): void {
    // console.log("sendInternal", event);

    if (isInfoHandler(this.component)) {
      // @ts-ignore - already checked if handleInfo is defined
      this.context = this.component.handleInfo(event, this.buildLiveViewSocket(ws, topic));

      const view = this.component.render(this.context);

      const reply: PhxDiffReply = [
        null, // no join reference
        null, // no message reference
        topic,
        "diff",
        view.partsTree(false) as any
      ]

      this.sendPhxReply(ws, reply);
    }
    else {
      console.error("received internal event but no handleInfo in component", this.component);
    }
  }

  private buildLiveViewSocket(ws: WebSocket, topic: string): LiveViewSocket<unknown> {
    return {
      id: topic,
      connected: true, // websocket is connected
      ws, // the websocket
      context: this.context,
      sendInternal: (event) => this.sendInternal(ws, event, topic),
      repeat: (fn, intervalMillis) => this.repeat(fn, intervalMillis),
    }
  }

  private sendPhxReply(ws: WebSocket, reply: PhxOutgoingMessage<any>) {
    ws.send(JSON.stringify(reply), { binary: false }, (err: any) => {
      if (err) {
        if (ws.CLOSED) {
          this.socketIsClosed = true;
          this.shutdown();
          console.error("socket is closed", err, "...shutting down topic", reply[2], "for component", this.component);
        } else {

        }
      }
    });
  }

}

function isInfoHandler(component: LiveViewComponent<unknown, unknown>) {
  return "handleInfo" in component;
}

function isEventHandler(component: LiveViewComponent<unknown, unknown>) {
  return "handleEvent" in component;
}