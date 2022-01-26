import { RenderedNode, PhxOutgoingMessage, PhxJoinIncoming, PhxHeartbeatIncoming, PhxIncomingMessage, PhxClickPayload, PhxFormPayload, PhxDiffReply, PhxLivePatchIncoming } from './types';
import WebSocket from 'ws';
import { LiveViewComponent } from '../types';
import { LiveViewRouter } from '../types';
import jwt from 'jsonwebtoken';
import { LiveViewComponentManager } from './component_manager';

export class MessageRouter {

  topicComponentManager: { [key: string]: LiveViewComponentManager } = {};
  heartbeatRouter: { [key: string]: LiveViewComponentManager } = {};

  onMessage(ws: WebSocket, message: WebSocket.RawData, router: LiveViewRouter, connectionId: string, signingSecret: string) {
    console.log('connectionId', connectionId);
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
            componentManager.onEvent(ws, rawPhxMessage as PhxIncomingMessage<PhxClickPayload | PhxFormPayload>);
          } else {
            console.log("expected component manager for topic", topic);
          }
          break;
        case "live_patch":
          componentManager = this.topicComponentManager[topic];
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

    // cleanup unhealthy component managers
    Object.keys(this.topicComponentManager).forEach(key => {
      const cm = this.topicComponentManager[key];
      if (!cm.isHealthy()) {
        cm.shutdown()
        console.log("deleting", key, " from topicComponentManager");
        delete this.topicComponentManager[key];
      }
    })

    // cleanup unhealthy heartbeat routers
    Object.keys(this.heartbeatRouter).forEach(key => {
      const cm = this.heartbeatRouter[key];
      if (!cm.isHealthy()) {
        cm.shutdown()
        console.log("deleting", key, " from heartbeatRouter");
        delete this.heartbeatRouter[key];
      }
    })
  }


  onPhxJoin(ws: WebSocket, message: PhxJoinIncoming, router: LiveViewRouter, signingSecret: string, connectionId: string) {

    // use url to route join request to component
    const [joinRef, messageRef, topic, event, payload] = message;
    const { url: urlString } = payload;
    const url = new URL(urlString);
    const component = router[url.pathname];
    if (!component) {
      console.error("no component found for", url);
      return;
    }

    // TODO - iterate through other component managers and detect dead ones via heartbeat
    // remove from heartbeat and topic routers

    const componentManager = new LiveViewComponentManager(component, signingSecret);
    this.topicComponentManager[topic] = componentManager;
    this.heartbeatRouter[connectionId] = componentManager;
    componentManager.handleJoin(ws, message);

    console.log("heartbeatRouter", Object.keys(this.heartbeatRouter));
    console.log("topicComponentManager", Object.keys(this.topicComponentManager));

  }

  onHeartbeat(ws: WebSocket, message: PhxHeartbeatIncoming, topic: string, connectionId: string) {
    const componentManager = this.heartbeatRouter[connectionId];

    if (componentManager) {
      componentManager.onHeartbeat(ws, message);
    } else {
      console.log("expected component manager for topic", topic);
    }
  }
}