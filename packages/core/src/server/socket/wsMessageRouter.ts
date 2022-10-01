import { LiveViewRouter } from "..";
import { SerDe } from "../adaptor";
import { FileSystemAdaptor } from "../adaptor/files";
import { FlashAdaptor } from "../adaptor/flash";
import { WsAdaptor } from "../adaptor/websocket";
import { LiveViewWrapperTemplate, matchRoute } from "../live";
import { PubSub } from "../pubsub/pubSub";
import { LiveViewManager } from "./liveViewManager";
import { PhxHeartbeatIncoming, PhxIncomingMessage, PhxJoinIncoming, PhxJoinUploadIncoming, PhxProtocol } from "./types";

/**
 * LiveViewJS Router for web socket messages.  Determines if a message is a `LiveView` message and routes it
 * to the correct LiveView based on the meta data.
 */
export class WsMessageRouter {
  private router: LiveViewRouter;
  private pubSub: PubSub;
  private flashAdaptor: FlashAdaptor;
  private serDe: SerDe;
  private fileSystemAdaptor: FileSystemAdaptor;
  private liveViewRootTemplate?: LiveViewWrapperTemplate;

  constructor(
    router: LiveViewRouter,
    pubSub: PubSub,
    flashAdaptor: FlashAdaptor,
    serDe: SerDe,
    filesAdapter: FileSystemAdaptor,
    liveViewRootTemplate?: LiveViewWrapperTemplate
  ) {
    this.router = router;
    this.pubSub = pubSub;
    this.flashAdaptor = flashAdaptor;
    this.serDe = serDe;
    this.fileSystemAdaptor = filesAdapter;
    this.liveViewRootTemplate = liveViewRootTemplate;
  }

  /**
   * Handles incoming websocket messages including binary and text messages and manages
   * routing those messages to the correct LiveViewManager.
   * @param connectionId the connection id of the websocket connection
   * @param data text or binary message data
   * @param wsAdaptor an instance of the websocket adaptor used to send messages to the client
   * @param isBinary whether the message is a binary message
   */
  public async onMessage(
    connectionId: string,
    data: string | unknown,
    wsAdaptor: WsAdaptor,
    isBinary?: boolean
  ): Promise<void> {
    if (isBinary) {
      // assume binary data is an "upload_binary" type message"
      await this.pubSub.broadcast(connectionId, {
        type: "upload_binary",
        message: { data },
      });
      return;
    }

    // not binary so parse json to phx message
    const rawPhxMessage: PhxIncomingMessage<unknown> = JSON.parse((data as string).toString());

    // rawPhxMessage must be an array with 5 elements
    if (typeof rawPhxMessage === "object" && Array.isArray(rawPhxMessage) && rawPhxMessage.length === 5) {
      const event = rawPhxMessage[PhxProtocol.event];
      const topic = rawPhxMessage[PhxProtocol.topic];
      try {
        switch (event) {
          case "phx_join":
            // phx_join event used for both LiveView joins and LiveUpload joins
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
              // istanbul ignore next
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
          case "allow_upload":
          case "progress":
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
    // get the url or redirect url from the message payload
    const payload = message[PhxProtocol.payload];
    const { url: urlString, redirect: redirectString } = payload;
    const joinUrl = urlString || redirectString;
    if (!joinUrl) {
      throw Error(`no url or redirect in join message ${message}`);
    }
    const url = new URL(joinUrl);

    // route to the correct component based on the resolved url (pathname)
    const matchResult = matchRoute(this.router, url.pathname);
    if (!matchResult) {
      throw Error(`no LiveView found for ${url}`);
    }
    const [liveView, mr] = matchResult;

    // create a LiveViewManager for this connection / LiveView
    const liveViewManager = new LiveViewManager(
      liveView,
      connectionId,
      wsAdaptor,
      this.serDe,
      this.pubSub,
      this.flashAdaptor,
      this.fileSystemAdaptor,
      mr.params,
      this.liveViewRootTemplate
    );
    await liveViewManager.handleJoin(message);
  }
}
