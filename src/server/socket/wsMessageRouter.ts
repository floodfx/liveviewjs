import { LiveViewRouter } from "..";
import { SerDe } from "../adaptor";
import { FlashAdaptor } from "../adaptor/flash";
import { WsAdaptor } from "../adaptor/websocket";
import { LiveViewTemplate } from "../live";
import { PubSub } from "../pubsub/pubSub";
import { SessionData } from "../session";
import { LiveViewManager } from "./liveViewManager";
import { PhxHeartbeatIncoming, PhxIncomingMessage, PhxJoinIncoming, PhxProtocol } from "./types";

export class WsMessageRouter {
  private serDe: SerDe;
  private pubSub: PubSub;
  private flashAdaptor: FlashAdaptor;
  private liveViewRootTemplate?: (sessionData: SessionData, innerContent: LiveViewTemplate) => LiveViewTemplate;

  constructor(
    serDe: SerDe,
    pubSub: PubSub,
    flashAdaptor: FlashAdaptor,
    liveViewRootTemplate?: (sessionData: SessionData, innerContent: LiveViewTemplate) => LiveViewTemplate
  ) {
    this.serDe = serDe;
    this.pubSub = pubSub;
    this.flashAdaptor = flashAdaptor;
    this.liveViewRootTemplate = liveViewRootTemplate;
  }

  public async onMessage(wsAdaptor: WsAdaptor, messageString: string, router: LiveViewRouter, connectionId: string) {
    // parse string to JSON
    const rawPhxMessage: PhxIncomingMessage<unknown> = JSON.parse(messageString);

    // rawPhxMessage must be an array with 5 elements
    if (typeof rawPhxMessage === "object" && Array.isArray(rawPhxMessage) && rawPhxMessage.length === 5) {
      const event = rawPhxMessage[PhxProtocol.event];
      const topic = rawPhxMessage[PhxProtocol.topic];
      try {
        switch (event) {
          case "phx_join":
            // handle phx_join seperate from other events so we can create a new
            // component manager and send the join message to it
            await this.onPhxJoin(wsAdaptor, rawPhxMessage as PhxJoinIncoming, router, connectionId);
            break;
          case "heartbeat":
            // send heartbeat to component manager via connectionId broadcast
            await this.pubSub.broadcast(connectionId, {
              type: event,
              message: rawPhxMessage as PhxHeartbeatIncoming,
            });
            break;
          case "event":
          case "live_patch":
          case "phx_leave":
            // other events we can send via topic broadcast
            await this.pubSub.broadcast(topic, { type: event, message: rawPhxMessage as PhxIncomingMessage<any> });
            break;
          default:
            throw new Error(`unexpected protocol event ${rawPhxMessage}`);
        }
      } catch (e) {
        console.error(`error handling phx message ${rawPhxMessage}`, e);
      }
    } else {
      // message format is incorrect so say something
      console.error(`error unknown message type for connectionId "${connectionId}". `, rawPhxMessage);
    }
  }

  public async onClose(code: number, connectionId: string) {
    // when client closes connection send phx_leave message
    // to component manager via connectionId broadcast
    await this.pubSub.broadcast(connectionId, {
      type: "phx_leave",
      message: [null, null, "phoenix", "phx_leave", {}],
    });
  }

  private async onPhxJoin(
    wsAdaptor: WsAdaptor,
    message: PhxJoinIncoming,
    router: LiveViewRouter,
    connectionId: string
  ) {
    // use url to route join request to component
    const payload = message[PhxProtocol.payload];
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

    const liveViewManager = new LiveViewManager(
      component,
      connectionId,
      wsAdaptor,
      this.serDe,
      this.pubSub,
      this.flashAdaptor,
      this.liveViewRootTemplate
    );
    await liveViewManager.handleJoin(message);
  }
}
