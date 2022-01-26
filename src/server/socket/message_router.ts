import { RenderedNode, PhxOutgoingMessage, PhxJoinIncoming, PhxHeartbeatIncoming, PhxIncomingMessage, PhxClickPayload, PhxFormPayload, PhxDiffReply, PhxLivePatchIncoming } from './types';
import WebSocket from 'ws';
import { LiveViewComponent } from '../types';
import { LiveViewRouter } from '../types';
import jwt from 'jsonwebtoken';
import { LiveViewComponentManager } from './component_manager';
import { LiveViewSocket } from '..';

const topicComponentManager: { [key: string]: LiveViewComponentManager } = {};
const heartbeatRouter: { [key: string]: LiveViewComponentManager } = {};

export function onMessage(ws: WebSocket, message: WebSocket.RawData, router: LiveViewRouter, connectionId: string, signingSecret: string) {

  // parse string to JSON
  const rawPhxMessage: PhxIncomingMessage<unknown> = JSON.parse(message.toString());

  // rawPhxMessage must be an array with 5 elements
  if (typeof rawPhxMessage === 'object' && Array.isArray(rawPhxMessage) && rawPhxMessage.length === 5) {
    const [joinRef, messageRef, topic, event, payload] = rawPhxMessage;

    let componentManager: LiveViewComponentManager | undefined;
    switch (event) {
      case "phx_join":
        // assume componentManager is not defined since join creates a new component manager
        onPhxJoin(ws, rawPhxMessage as PhxJoinIncoming, router, signingSecret, connectionId);
        break;
      case "heartbeat":
        // heartbeat comes in as a "phoenix" topic so lookup via connectionId
        componentManager = heartbeatRouter[connectionId];
        if (componentManager) {
          componentManager.onHeartbeat(ws, rawPhxMessage as PhxHeartbeatIncoming);
        } else {
          console.log("expected component manager for topic", topic);
        }
        break;
      case "event":
        // lookup component manager for this topic
        componentManager = topicComponentManager[topic];
        if (componentManager) {
          componentManager.onEvent(ws, rawPhxMessage as PhxIncomingMessage<PhxClickPayload | PhxFormPayload>);
        } else {
          console.log("expected component manager for topic", topic);
        }
        break;
      case "live_patch":
        componentManager = topicComponentManager[topic];
        if (componentManager) {
          componentManager.onLivePatch(ws, rawPhxMessage as PhxLivePatchIncoming);
        } else {
          console.log("expected component manager for topic", topic);
        }
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


export function onPhxJoin(ws: WebSocket, message: PhxJoinIncoming, router: LiveViewRouter, signingSecret: string, connectionId: string) {

  // use url to route join request to component
  const [joinRef, messageRef, topic, event, payload] = message;
  const { url: urlString } = payload;
  const url = new URL(urlString);
  const component = router[url.pathname];
  if (!component) {
    console.error("no component found for", url);
    return;
  }

  const componentManager = new LiveViewComponentManager(component, signingSecret);
  topicComponentManager[topic] = componentManager;
  heartbeatRouter[connectionId] = componentManager;
  componentManager.handleJoin(ws, message);

}

// export function sendInternalMessage(socket: LiveViewSocket<unknown>, component: LiveViewComponent<any, any>, event: any, payload?: any) {

//   // check if component has event handler
//   if (!(component as any).handleInfo) {
//     console.warn("no info handler for component", component);
//     return;
//   }

//   // @ts-ignore
//   const ctx = component.handleInfo(event, socket);

//   const view = component.render(ctx);

//   const reply: PhxDiffReply = [
//     null, // no join reference
//     null, // no message reference
//     socket.id,
//     "diff",
//     view.partsTree(false) as any
//   ]

//   sendPhxReply(socket.ws!, reply);
// }


// function sendPhxReply(ws: WebSocket, reply: PhxOutgoingMessage<any>) {
//   ws.send(JSON.stringify(reply), { binary: false }, (err: any) => {
//     if (err) {
//       console.error("error", err);
//     }
//   });
// }


// function printHtml(rendered: RenderedNode) {
//   const statics = rendered.s;
//   let html = statics[0];
//   for (let i = 1; i < statics.length; i++) {
//     html += rendered[i - 1] + statics[i];
//   }
//   console.log("html:\n", html);
// }