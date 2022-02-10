import { PhxJoinIncoming, PhxHeartbeatIncoming, PhxIncomingMessage, PhxClickPayload, PhxFormPayload, PhxLivePatchIncoming, PhxKeyDownPayload, PhxKeyUpPayload, PhxBlurPayload, PhxFocusPayload } from './types';
import WebSocket from 'ws';
import { LiveViewRouter } from '../component/types';
import { LiveViewComponentManager } from './component_manager';

export class MessageRouter {

  topicComponentManager: Record<string, LiveViewComponentManager> = {};
  heartbeatRouter: Record<string, LiveViewComponentManager> = {};

  onMessage(ws: WebSocket, message: WebSocket.RawData, router: LiveViewRouter, connectionId: string, signingSecret: string) {
    // parse string to JSON
    const rawPhxMessage: PhxIncomingMessage<unknown> = JSON.parse(message.toString());

    // rawPhxMessage must be an array with 5 elements
    if (typeof rawPhxMessage === 'object' && Array.isArray(rawPhxMessage) && rawPhxMessage.length === 5) {
      const [joinRef, messageRef, topic, event, payload] = rawPhxMessage;

      let componentManager: LiveViewComponentManager | undefined;
      switch (event) {
        case "phx_join":
          // assume componentManager is not defined since join creates a new component manager
          this.onPhxJoin(ws, rawPhxMessage as PhxJoinIncoming, router, signingSecret, connectionId);
          break;
        case "heartbeat":
          // heartbeat comes in as a "phoenix" topic so lookup via connectionId
          this.onHeartbeat(ws, rawPhxMessage as PhxHeartbeatIncoming, topic, connectionId);
          break;
        case "event":
          // lookup component manager for this topic
          componentManager = this.topicComponentManager[topic];
          if (componentManager) {
            const message = rawPhxMessage as PhxIncomingMessage<PhxClickPayload | PhxFormPayload | PhxKeyDownPayload | PhxKeyUpPayload | PhxFocusPayload | PhxBlurPayload>;
            componentManager.onEvent(ws, message);
          } else {
            console.error(`expected component manager for topic:${topic} and event:${event}`);
          }
          break;
        case "live_patch":
          componentManager = this.topicComponentManager[topic];
          if (componentManager) {
            componentManager.onLivePatch(ws, rawPhxMessage as PhxLivePatchIncoming);
          } else {
            console.error(`expected component manager for topic:${topic} and event:${event}`);
          }
          break;
        case "phx_leave":
          componentManager = this.topicComponentManager[topic];
          if (componentManager) {
            componentManager.shutdown();
            delete this.topicComponentManager[topic];
          } else {
            console.warn(`expected component manager for topic:${topic} and event:${event}`);
          }
          break;
        default:
          throw new Error(`unexpected protocol event ${rawPhxMessage}`);
      }
    }
    else {
      // unknown message type
      throw new Error(`unknown message type ${rawPhxMessage}`);
    }

    // cleanup unhealthy component managers
    Object.keys(this.topicComponentManager).forEach(key => {
      const cm = this.topicComponentManager[key];
      if (!cm.isHealthy) {
        cm.shutdown()
        delete this.topicComponentManager[key];
      }
    })

    // cleanup unhealthy heartbeat routers
    Object.keys(this.heartbeatRouter).forEach(key => {
      const cm = this.heartbeatRouter[key];
      if (!cm.isHealthy) {
        cm.shutdown()
        delete this.heartbeatRouter[key];
      }
    })
  }


  onPhxJoin(ws: WebSocket, message: PhxJoinIncoming, router: LiveViewRouter, signingSecret: string, connectionId: string) {

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

    const componentManager = new LiveViewComponentManager(component, signingSecret);
    this.topicComponentManager[topic] = componentManager;
    this.heartbeatRouter[connectionId] = componentManager;
    componentManager.handleJoin(ws, message);
  }

  onHeartbeat(ws: WebSocket, message: PhxHeartbeatIncoming, topic: string, connectionId: string) {
    const componentManager = this.heartbeatRouter[connectionId];
    if (componentManager) {
      componentManager.onHeartbeat(ws, message);
    }
  }
}