import { LiveViewRouter } from "..";
import { SerDe } from "../adaptor";
import { FlashAdaptor } from "../adaptor/flash";
import { WsAdaptor } from "../adaptor/websocket";
import { LiveViewRootRenderer, LiveViewTemplate } from "../live";
import { PubSub } from "../pubsub/pubSub";
import { SessionData } from "../session";
import { LiveViewManager } from "./liveViewManager";
import { PhxHeartbeatIncoming, PhxIncomingMessage, PhxJoinIncoming, PhxProtocol } from "./types";

/**
 * LiveViewJS Router for web socket messages.  Determines if a message is a `LiveView` message and routes it
 * to the correct LiveView based on the meta data.
 */
export class WsMessageRouter {
  private router: LiveViewRouter;
  private pubSub: PubSub;
  private flashAdaptor: FlashAdaptor;
  private serDe: SerDe;
  private liveViewRootTemplate?: LiveViewRootRenderer;

  constructor(
    router: LiveViewRouter,
    pubSub: PubSub,
    flashAdaptor: FlashAdaptor,
    serDe: SerDe,
    liveViewRootTemplate?: LiveViewRootRenderer
  ) {
    this.router = router;
    this.pubSub = pubSub;
    this.flashAdaptor = flashAdaptor;
    this.serDe = serDe;
    this.liveViewRootTemplate = liveViewRootTemplate;
  }

  public async onMessage(connectionId: string, messageString: string, wsAdaptor: WsAdaptor) {
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
            await this.onPhxJoin(connectionId, rawPhxMessage as PhxJoinIncoming, wsAdaptor);
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
      console.error(`error unknown message type for connectionId "${connectionId}". `, rawPhxMessage);
    }
  }

  public async onClose(connectionId: string) {
    // when client closes connection send phx_leave message
    // to component manager via connectionId broadcast
    await this.pubSub.broadcast(connectionId, {
      type: "phx_leave",
      message: [null, null, "phoenix", "phx_leave", {}],
    });
  }

  private async onPhxJoin(connectionId: string, message: PhxJoinIncoming, wsAdaptor: WsAdaptor) {
    // use url to route join request to component
    const payload = message[PhxProtocol.payload];
    const { url: urlString, redirect: redirectString } = payload;
    const joinUrl = urlString || redirectString;
    if (!joinUrl) {
      throw Error(`no url or redirect in join message ${message}`);
    }
    const url = new URL(joinUrl);
    const component = this.router[url.pathname];
    if (!component) {
      throw Error(`no component found for ${url}`);
    }

    // create a LiveViewManager for this connection / LiveView
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
