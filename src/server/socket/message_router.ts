import { PhxReply, PhxSocketProtocolNames, RenderedNode, PhxOutgoingMessage, newHeartbeatReply, PhxJoinIncoming, PhxHeartbeatIncoming, PhxClickEvent, PhxFormEvent, PhxIncomingMessage, PhxClickPayload, PhxFormPayload, PhxSocket, PhxDiffReply, PhxLivePatchIncoming } from './types';
import WebSocket from 'ws';
import http, { Server, createServer } from 'http';
// import { router } from '../live/router';
import { URLSearchParams } from 'url';
import { LiveViewComponent } from '../types';
import { LiveViewRouter } from '../types';
import jwt from 'jsonwebtoken';

export function onMessage(ws: WebSocket, message: WebSocket.RawData, topicToPath: { [key: string]: string }, router: LiveViewRouter) {

  // get raw message to string
  const stringMsg = message.toString();
  // console.log("message", stringMsg);

  // parse string to JSON
  const rawPhxMessage: PhxIncomingMessage<unknown> = JSON.parse(stringMsg);
  // console.log("rawPhxMessage", rawPhxMessage);

  // rawPhxMessage must be an array with 5 elements
  if (typeof rawPhxMessage === 'object' && Array.isArray(rawPhxMessage) && rawPhxMessage.length === 5) {
    const [joinRef, messageRef, topic, event, payload] = rawPhxMessage;
    switch (event) {
      case "phx_join":
        onPhxJoin(ws, rawPhxMessage as PhxJoinIncoming, topicToPath, router);
        break;
      case "heartbeat":
        onHeartbeat(ws, rawPhxMessage as PhxHeartbeatIncoming, topicToPath, router);
        break;
      case "event":
        // map based on event type
        const { type } = payload as PhxClickPayload | PhxFormPayload
        console
        switch (type) {
          case "click":
            onPhxClickEvent(ws, rawPhxMessage as PhxClickEvent, topicToPath, router);
            break;
          case "form":
            onPhxFormEvent(ws, rawPhxMessage as PhxFormEvent, topicToPath, router);
            break;
          default:
            console.error("unhandeded event type", type);
        }
        break;
      case "live_patch":
        onPhxLivePatch(ws, rawPhxMessage as PhxLivePatchIncoming, topicToPath, router);
        break;
      default:
        console.error("unhandeded protocol event", event);
    }
  }
  else {
    // unknown message type
    console.error("unknown message type", rawPhxMessage);
  }
}


export function onPhxJoin(ws: WebSocket, message: PhxJoinIncoming, topicToPath: { [key: string]: string }, router: LiveViewRouter) {

  // use url to route join request to component
  const [joinRef, messageRef, topic, event, payload] = message;
  const { url: urlString } = payload;
  const url = new URL(urlString);
  const component = router[url.pathname];
  if (!component) {
    console.error("no component found for", url);
    return;
  }

  // update topicToPath
  topicToPath[topic] = url.pathname;

  // extract params, session and socket from payload
  const { params: payloadParams, session: payloadSession, static: payloadStatic } = payload;

  // TODO - use session from cookie
  // const session = jwt.verify(payloadSession, signingSecret) as any;

  const phxSocket: PhxSocket = {
    id: topic,
    connected: true, // websocket is connected
    ws, // the websocket
  }
  // pass in phx_join payload params, session, and socket
  let ctx = component.mount(payloadParams, {}, phxSocket);

  // attempt to call handleParams if it exists
  if ((component as any).handleParams) {
    // @ts-ignore - searchParams returns an entries but types are wrong
    const urlParams = Object.fromEntries(url.searchParams);
    // @ts-ignore
    const hpCtx = component.handleParams(urlParams, urlString, { id: topic });
    // merge contexts
    if (hpCtx) {
      ctx = { ...ctx, ...hpCtx };
    }
  }

  // now render this component
  const view = component.render(ctx);

  // send full view parts (statics & dynaimcs back)
  const replyPayload = {
    response: {
      rendered: view.partsTree()
    },
    status: "ok"
  }

  sendPhxReply(ws, newPhxReply(message, replyPayload));
}



export function onPhxLivePatch(ws: WebSocket, message: PhxLivePatchIncoming, topicToPath: { [key: string]: string }, router: LiveViewRouter) {

  const [joinRef, messageRef, topic, event, payload] = message;

  // route using topic to lookup path
  const path = topicToPath[topic];
  const component = router[path];
  if (!component) {
    console.error("no mapping found topic", topic);
    return;
  }

  // check if component has event handler
  // this type of message goes to handleParams
  if (!(component as any).handleParams) {
    console.warn("no event handler for component", component);
    return;
  }

  const { url: urlString } = payload;
  const url = new URL(urlString);

  // @ts-ignore - searchParams returns an entries but types are wrong
  const params = Object.fromEntries(url.searchParams);
  // TODO update types to have optional handleEvent???
  // alternatively have a abstract class defining empty handleParams?
  // @ts-ignore
  const ctx = component.handleParams(params, urlString, { id: topic });

  const view = component.render(ctx);

  const replyPayload = {
    response: {
      diff: {
        ...view.partsTree(false)
      }
    },
    status: "ok"
  }

  sendPhxReply(ws, newPhxReply(message, replyPayload));
}

export function onPhxFormEvent(ws: WebSocket, message: PhxFormEvent, topicToPath: { [key: string]: string }, router: LiveViewRouter) {

  const [joinRef, messageRef, topic, event, payload] = message;

  // route using topic to lookup path
  const path = topicToPath[topic];
  const component = router[path];
  if (!component) {
    console.error("no mapping found topic", topic);
    return;
  }

  // check if component has event handler
  if (!(component as any).handleEvent) {
    console.warn("no event handler for component", component);
    return;
  }

  const { type, event: payloadEvent, value } = payload;
  const params = new URLSearchParams(value);
  // TODO update types to have optional handleEvent???
  // @ts-ignore
  const ctx = component.handleEvent(payloadEvent, Object.fromEntries(params), { id: topic });

  const view = component.render(ctx);

  const replyPayload = {
    response: {
      diff: {
        ...view.partsTree(false)
      }
    },
    status: "ok"
  }

  sendPhxReply(ws, newPhxReply(message, replyPayload));
}

export function onPhxClickEvent(ws: WebSocket, message: PhxClickEvent, topicToPath: { [key: string]: string }, router: LiveViewRouter) {

  const [joinRef, messageRef, topic, event, payload] = message;

  // route using topic to lookup path
  const path = topicToPath[topic];
  const component = router[path];
  if (!component) {
    console.error("no mapping found topic", topic);
    return;
  }

  // check if component has event handler
  if (!(component as any).handleEvent) {
    console.warn("no event handler for component", component);
    return;
  }

  const { type, event: payloadEvent, value } = payload;
  // TODO update types to have optional handleEvent???
  // @ts-ignore
  const ctx = component.handleEvent(payloadEvent, value, { id: topic });

  const view = component.render(ctx);

  const replyPayload = {
    response: {
      diff: {
        ...view.partsTree(false)
      }
    },
    status: "ok"
  }

  sendPhxReply(ws, newPhxReply(message, replyPayload));
}



export function sendInternalMessage(socket: PhxSocket, component: LiveViewComponent<any>, event: any, payload?: any) {

  // check if component has event handler
  if (!(component as any).handleInfo) {
    console.warn("no info handler for component", component);
    return;
  }

  // @ts-ignore
  const ctx = component.handleInfo(event, socket);

  const view = component.render(ctx);

  const reply: PhxDiffReply = [
    null, // no join reference
    null, // no message reference
    socket.id,
    "diff",
    view.partsTree(false) as any
  ]

  sendPhxReply(socket.ws!, reply);
}

export function onHeartbeat(ws: WebSocket, message: PhxHeartbeatIncoming, topicToPath: { [key: string]: string }, router: LiveViewRouter) {
  // TODO keep track of last heartbeat and disconnect if no heartbeat for a while?
  sendPhxReply(ws, newHeartbeatReply(message));
}

function newPhxReply(from: PhxIncomingMessage<unknown>, payload: any): PhxReply {
  return [
    from[0],
    from[1],
    from[2],
    "phx_reply",
    payload
  ]
}


function sendPhxReply(ws: WebSocket, reply: PhxOutgoingMessage<any>) {
  ws.send(JSON.stringify(reply), { binary: false }, (err: any) => {
    if (err) {
      console.error("error", err);
    }
  });
}


function printHtml(rendered: RenderedNode) {
  const statics = rendered.s;
  let html = statics[0];
  for (let i = 1; i < statics.length; i++) {
    html += rendered[i - 1] + statics[i];
  }
  console.log("html:\n", html);
}