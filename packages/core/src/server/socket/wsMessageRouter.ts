import { LiveViewRouter } from "..";
import { SerDe } from "../adaptor";
import { FilesAdapter } from "../adaptor/files";
import { FlashAdaptor } from "../adaptor/flash";
import { WsAdaptor } from "../adaptor/websocket";
import { LiveViewRootRenderer } from "../live";
import { PubSub } from "../pubsub/pubSub";
import { LiveViewManager } from "./liveViewManager";
import {
  PhxAllowUploadIncoming,
  PhxHeartbeatIncoming,
  PhxIncomingMessage,
  PhxJoinIncoming,
  PhxJoinUploadIncoming,
  PhxProgressUploadIncoming,
  PhxProtocol,
} from "./types";

/**
 * LiveViewJS Router for web socket messages.  Determines if a message is a `LiveView` message and routes it
 * to the correct LiveView based on the meta data.
 */
export class WsMessageRouter {
  private router: LiveViewRouter;
  private pubSub: PubSub;
  private flashAdaptor: FlashAdaptor;
  private serDe: SerDe;
  private filesAdapter: FilesAdapter;
  private liveViewRootTemplate?: LiveViewRootRenderer;

  constructor(
    router: LiveViewRouter,
    pubSub: PubSub,
    flashAdaptor: FlashAdaptor,
    serDe: SerDe,
    filesAdapter: FilesAdapter,
    liveViewRootTemplate?: LiveViewRootRenderer
  ) {
    this.router = router;
    this.pubSub = pubSub;
    this.flashAdaptor = flashAdaptor;
    this.serDe = serDe;
    this.filesAdapter = filesAdapter;
    this.liveViewRootTemplate = liveViewRootTemplate;
  }

  public async onMessage(connectionId: string, data: string | unknown, wsAdaptor: WsAdaptor, isBinary?: boolean) {
    if (isBinary) {
      // save binary data to disk
      console.log("got binary data on connection", connectionId, data instanceof Buffer ? data.length : "unknown");
      await this.pubSub.broadcast(connectionId, {
        type: "upload_binary",
        // TODO: size of data defaults to 64k which should be fine to broadcast
        message: { data },
      });
      return;
    }
    // parse string to JSON
    const rawPhxMessage: PhxIncomingMessage<unknown> = JSON.parse((data as string).toString());

    // rawPhxMessage must be an array with 5 elements
    if (typeof rawPhxMessage === "object" && Array.isArray(rawPhxMessage) && rawPhxMessage.length === 5) {
      const event = rawPhxMessage[PhxProtocol.event];
      const topic = rawPhxMessage[PhxProtocol.topic];
      console.log("connectionId", connectionId, "received message", rawPhxMessage, "topic", topic, "event", event);
      try {
        switch (event) {
          case "phx_join":
            // handle phx_join seperate from other events so we can create a new
            // component manager and send the join message to it
            // check prefix of topic to determine if LiveView (lv:*) or LiveViewUpload (lvu:*)
            if (topic.startsWith("lv:")) {
              await this.onPhxJoin(connectionId, rawPhxMessage as PhxJoinIncoming, wsAdaptor);
            } else if (topic.startsWith("lvu:")) {
              // since we don't have the lv topic id, use the connectionId to broadcast to the component manager
              await this.pubSub.broadcast(connectionId, {
                type: "phx_join_upload",
                message: rawPhxMessage as PhxJoinUploadIncoming,
              });
            } else {
              throw new Error(`Unknown phx_join prefix: ${topic}`);
            }
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
          case "allow_upload":
            // handle file uploads
            await this.pubSub.broadcast(topic, { type: event, message: rawPhxMessage as PhxAllowUploadIncoming });
            break;
          case "progress":
            // handle file progress
            await this.pubSub.broadcast(topic, { type: event, message: rawPhxMessage as PhxProgressUploadIncoming });
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
      this.filesAdapter,
      this.liveViewRootTemplate
    );
    await liveViewManager.handleJoin(message);
  }
}
