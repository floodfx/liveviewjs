import WebSocket from 'ws';
import { LiveViewRouter } from '../component/types';
import { PubSub } from '../pubsub/SingleProcessPubSub';
import { LiveViewComponentManager } from './component_manager';
import { PhxBlurPayload, PhxClickPayload, PhxFocusPayload, PhxFormPayload, PhxHeartbeatIncoming, PhxHookPayload, PhxIncomingMessage, PhxJoinIncoming, PhxKeyDownPayload, PhxKeyUpPayload, PhxLivePatchIncoming } from './types';

export type PhxMessage =
 // incoming from client
 | {type: "phx_join", message: PhxJoinIncoming}
 | {type: "heartbeat", message: PhxHeartbeatIncoming}
 | {type: "event", message: PhxIncomingMessage<PhxClickPayload | PhxFormPayload | PhxKeyDownPayload | PhxKeyUpPayload | PhxFocusPayload | PhxBlurPayload | PhxHookPayload>}
 | {type: "live_patch", message: PhxLivePatchIncoming}
 | {type: "phx_leave", message: PhxIncomingMessage<{}>}

export class MessageRouter {

  async onMessage(ws: WebSocket, message: WebSocket.RawData, router: LiveViewRouter, connectionId: string, signingSecret: string) {
    // parse string to JSON
    const rawPhxMessage: PhxIncomingMessage<unknown> = JSON.parse(message.toString());

    // rawPhxMessage must be an array with 5 elements
    if (typeof rawPhxMessage === 'object' && Array.isArray(rawPhxMessage) && rawPhxMessage.length === 5) {
      const [joinRef, messageRef, topic, event, payload] = rawPhxMessage;

      let componentManager: LiveViewComponentManager | undefined;
      try {
        switch (event) {
          case "phx_join":
            // handle phx_join seperate from other events so we can create a new
            // component manager and send the join message to it
            await this.onPhxJoin(ws, rawPhxMessage as PhxJoinIncoming, router, signingSecret, connectionId);
            break;
          case "heartbeat":
            // send heartbeat to component manager via connectionId broadcast
            PubSub.broadcast(connectionId, {type: event, message: rawPhxMessage})
            break;
          case "event":
          case "live_patch":
          case "phx_leave":
            // other events we can send via topic broadcast
            PubSub.broadcast(topic, {type: event, message: rawPhxMessage})
            break;
          default:
            throw new Error(`unexpected protocol event ${rawPhxMessage}`);
        }
      } catch (e) {
        throw e;
      }
    }
    else {
      // unknown message type
      throw new Error(`unknown message type ${rawPhxMessage}`);
    }

  }


  async onPhxJoin(ws: WebSocket, message: PhxJoinIncoming, router: LiveViewRouter, signingSecret: string, connectionId: string) {
    // use url to route join request to component
    const [joinRef, messageRef, topic, event, payload] = message;
    const { url: urlString, redirect: redirectString } = payload;
    const joinUrl = urlString || redirectString;
    if (!joinUrl) {
      throw Error(`no url or redirect in join message ${message}`);
    }
    const url = new URL(joinUrl);
    const component = router[url.pathname];
    if (!component) {
      throw Error(`no component found for ${url}`);
    }

    const componentManager = new LiveViewComponentManager(component, signingSecret, connectionId, ws);
    await componentManager.handleJoin(message);
  }

}