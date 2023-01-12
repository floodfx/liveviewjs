import crypto from "crypto";
import { nanoid } from "nanoid";
import { SerDe } from "../adaptor";
import { FileSystemAdaptor } from "../adaptor/files";
import { FlashAdaptor } from "../adaptor/flash";
import { WsAdaptor } from "../adaptor/websocket";
import {
  AnyLiveContext,
  AnyLiveEvent,
  AnyLiveInfo,
  AnyLivePushEvent,
  LiveComponent,
  LiveContext,
  LiveView,
  LiveViewMeta,
  LiveViewTemplate,
  LiveViewWrapperTemplate,
  PathParams,
  WsLiveComponentSocket,
} from "../live";
import { PubSub } from "../pubsub";
import { SessionData } from "../session";
import { HtmlSafeString, Parts, safe } from "../templates";
import { deepDiff } from "../templates/diff";
import { UploadConfig, UploadEntry } from "../upload";
import { BinaryUploadSerDe } from "../upload/binaryUploadSerDe";
import { ConsumeUploadedEntriesMeta, Info, WsLiveViewSocket } from "./liveSocket";
import { maybeAddStructuredClone } from "./structuredClone";
import {
  PhxAllowUploadIncoming,
  PhxBlurPayload,
  PhxClickPayload,
  PhxDiffReply,
  PhxFocusPayload,
  PhxFormPayload,
  PhxHeartbeatIncoming,
  PhxHookPayload,
  PhxIncomingMessage,
  PhxJoinIncoming,
  PhxJoinUploadIncoming,
  PhxKeyDownPayload,
  PhxKeyUpPayload,
  PhxLivePatchIncoming,
  PhxLVClearFlashPayload,
  PhxMessage,
  PhxOutgoingLivePatchPush,
  PhxOutgoingMessage,
  PhxProgressUploadIncoming,
  PhxProtocol,
} from "./types";
import { newHeartbeatReply, newPhxReply } from "./util";
maybeAddStructuredClone();
/**
 * Data kept for each `LiveComponent` instance.
 */
interface StatefulLiveComponentData<Context> {
  /**
   * compoundId (`${componentType}_${providedComponentId}`) of the component which is used to uniquely identify it
   * across the entire application.
   */
  compoundId: string;
  /**
   * The last calculated state of the component.
   */
  context: Context;
  /**
   * The last `Parts` tree rendered by the component.
   */
  parts: Parts;
  /**
   * Whether the component changed between the last two `render` calls and
   * therefore should be rerendered.
   */
  changed: boolean;
  /**
   * The internal componentId as calculated by the component manager as an
   * index into when the component was parsed via render.
   */
  cid: number;
  /**
   * The class name of the component, used for grouping components of the
   * same type together and running `handleEvent`s.
   */
  componentClass: string;
}

/**
 * The `LiveViewComponentManager` is responsible for managing the lifecycle of a `LiveViewComponent`
 * including routing of events, the state (i.e. context), and other aspects of the component.  The
 * `MessageRouter` is responsible for routing messages to the appropriate `LiveViewComponentManager`
 * based on the topic on the incoming socket messages.
 */
export class LiveViewManager {
  private connectionId: string;
  private joinId: string;
  private url: URL;

  private wsAdaptor: WsAdaptor;
  private subscriptionIds: Record<string, Promise<string>> = {};

  private liveView: LiveView;
  private intervals: NodeJS.Timeout[] = [];
  private session: SessionData;
  private pubSub: PubSub;
  private serDe: SerDe;
  private flashAdaptor: FlashAdaptor;
  private fileSystemAdaptor: FileSystemAdaptor;
  private uploadConfigs: { [key: string]: UploadConfig } = {};
  private activeUploadRef: string | undefined;

  private csrfToken?: string;
  private pathParams: PathParams;

  private _infoQueue: AnyLiveInfo[] = [];
  private _events: AnyLivePushEvent[] = [];

  private _pageTitle: string | undefined;
  private pageTitleChanged: boolean = false;

  private socket: WsLiveViewSocket;
  private liveViewRootTemplate?: LiveViewWrapperTemplate;
  private hasWarnedAboutMissingCsrfToken = false;

  private _parts: Parts | undefined;
  private _cidIndex = 0;

  constructor(
    liveView: LiveView,
    connectionId: string,
    wsAdaptor: WsAdaptor,
    serDe: SerDe,
    pubSub: PubSub,
    flashAdaptor: FlashAdaptor,
    fileAdapter: FileSystemAdaptor,
    pathParams: PathParams,
    liveViewRootTemplate?: LiveViewWrapperTemplate
  ) {
    this.liveView = liveView;
    this.connectionId = connectionId;
    this.wsAdaptor = wsAdaptor;
    this.serDe = serDe;
    this.pubSub = pubSub;
    this.flashAdaptor = flashAdaptor;
    this.fileSystemAdaptor = fileAdapter;
    this.liveViewRootTemplate = liveViewRootTemplate;
    this.pathParams = pathParams;

    // subscribe to events for a given connectionId which should only be heartbeat messages
    const subId = this.pubSub.subscribe<PhxMessage>(connectionId, this.handleSubscriptions.bind(this));
    // save subscription id for unsubscribing on shutdown
    this.subscriptionIds[connectionId] = subId;
  }

  /**
   * The `phx_join` event is the initial connection between the client and the server and initializes the
   * `LiveView`, sets up subscriptions for additional events, and otherwise prepares the `LiveView` for
   * future client interactions.
   * @param message a `PhxJoinIncoming` message
   */
  async handleJoin(message: PhxJoinIncoming) {
    try {
      const payload = message[PhxProtocol.payload];
      const topic = message[PhxProtocol.topic];

      // figure out if we are using url or redirect for join URL
      const { url: urlString, redirect: redirectString } = payload;
      if (urlString === undefined && redirectString === undefined) {
        throw new Error("Join message must have either a url or redirect property");
      }
      // checked one of these was defined in MessageRouter
      const url = new URL((urlString || redirectString)!);
      // save base for possible pushPatch base for URL
      this.url = url;

      // extract params, session and socket from payload
      const { params: payloadParams, session: payloadSession, static: payloadStatic } = payload;
      // set component manager csfr token
      this.csrfToken = payloadParams._csrf_token;

      // attempt to deserialize session
      this.session = await this.serDe.deserialize(payloadSession);
      // if session csrfToken does not match payload csrfToken, reject join
      if (this.session._csrf_token !== this.csrfToken) {
        console.error("Rejecting join due to mismatched csrfTokens", this.session._csrf_token, this.csrfToken);
        return;
      }

      // otherwise set the joinId as the phx topic
      this.joinId = topic;
      // subscribe to events on the joinId which includes events, live_patch, and phx_leave messages
      const subId = this.pubSub.subscribe<PhxMessage>(this.joinId, this.handleSubscriptions.bind(this));
      // again save subscription id for unsubscribing
      this.subscriptionIds[this.joinId] = subId;

      // run initial lifecycle steps for the liveview: mount => handleParams
      this.socket = this.newLiveViewSocket();
      await this.liveView.mount(this.socket, this.session, { ...payloadParams, ...this.pathParams });
      await this.liveView.handleParams(url, this.socket);

      // now the socket context had a chance to be updated, we run the render steps
      // step 1: render the `LiveView`
      let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());
      // step 2: if provided, wrap the rendered `LiveView` inside the root template
      view = await this.maybeWrapInRootTemplate(view);
      // step 2.5: store parts for later diffing after rootTemplate is applied
      this._parts = view.partsTree(true);
      // step 3: add any `LiveComponent` renderings to the parts tree
      let rendered = this.maybeAddLiveComponentsToParts(this._parts);
      // step 4: if set, add the page title to the parts tree
      rendered = this.maybeAddPageTitleToParts(rendered);
      // step 5: if added, add events to the parts tree
      rendered = this.maybeAddEventsToParts(rendered);

      // reply to the join message with the rendered parts tree
      const replyPayload = {
        response: {
          rendered,
        },
        status: "ok",
      };
      this.sendPhxReply(newPhxReply(message, replyPayload));

      // maybe send any queued info messages
      await this.maybeSendInfos();

      // remove temp data from the context
      this.socket.updateContextWithTempAssigns();
    } catch (e) {
      console.error("Error handling join", e);
    }
  }

  /**
   * Every event other than `phx_join` that is received over the connected WebSocket are passed into this
   * method and then dispatched the appropriate handler based on the message type.
   * @param phxMessage
   */
  public async handleSubscriptions(phxMessage: PhxMessage) {
    // console.log("handleSubscriptions", this.connectionId, this.joinId, phxMessage.type);
    try {
      const { type, message } = phxMessage;
      switch (type) {
        case "heartbeat":
          this.onHeartbeat(message);
          break;
        case "event":
          await this.onEvent(message);
          break;
        case "allow_upload":
          await this.onAllowUpload(message);
          break;
        case "live_patch":
          await this.onLivePatch(message);
          break;
        case "phx_leave":
          await this.onPhxLeave(message);
          break;
        case "phx_join_upload":
          await this.onPhxJoinUpload(message);
          break;
        case "upload_binary":
          await this.onUploadBinary(message);
          break;
        case "progress":
          await this.onProgressUpload(message);
          break;
        default:
          console.error(
            `Unknown message type:"${type}", message:"${JSON.stringify(phxMessage)}" on connectionId:"${
              this.connectionId
            }" and joinId:"${this.joinId}"`
          );
      }
    } catch (e) {
      /* istanbul ignore next */
      console.error("Error handling subscription", e);
    }
  }

  /**
   * Any message of type `event` is passed into this method and then handled based on the payload details of
   * the message including: click, form, key, blur/focus, and hook events.
   * @param message a `PhxEventIncoming` message with a different payload depending on the event type
   */
  public async onEvent(
    message: PhxIncomingMessage<
      | PhxClickPayload
      | PhxFormPayload
      | PhxKeyUpPayload
      | PhxKeyDownPayload
      | PhxBlurPayload
      | PhxFocusPayload
      | PhxHookPayload
      | PhxLVClearFlashPayload
    >
  ) {
    try {
      const payload = message[PhxProtocol.payload];
      const { type, event, cid } = payload;
      // TODO - handle uploads
      let value: Record<string, unknown> = {};
      switch (type) {
        case "click":
          // check if the click is a lv:clear-flash event
          if (event === "lv:clear-flash") {
            const clearFlashPayload = payload as PhxLVClearFlashPayload;
            const key = clearFlashPayload.value.key;
            this.clearFlash(key);
          }
          value = payload.value;
          break;
        case "keyup":
        case "keydown":
        case "blur":
        case "focus":
        case "hook":
          value = payload.value;
          break;
        case "form":
          // parse payload into form data
          value = Object.fromEntries(new URLSearchParams(payload.value));
          // if _csrf_token is set, ensure it is the same as session csrf token
          if (value.hasOwnProperty("_csrf_token")) {
            if (value._csrf_token !== this.csrfToken) {
              console.error(
                `Rejecting form submission due to mismatched csrfTokens. expected:"${this.csrfToken}", got:"${value._csrf_token}"`
              );
              return;
            }
          } else {
            if (!this.hasWarnedAboutMissingCsrfToken) {
              console.warn(
                `Warning: form event data missing _csrf_token value. \nConsider passing it in via a hidden input named "_csrf_token".  \nYou can get the value from the LiveViewMeta object passed the render method. \nWe won't warn you again for this instance of the LiveView.`
              );
              this.hasWarnedAboutMissingCsrfToken = true;
            }
          }

          // parse uploads into uploadConfig for given name
          if (payload.uploads) {
            const { uploads } = payload;
            // get _target from form data
            const target = value["_target"] as string;
            if (target && this.uploadConfigs.hasOwnProperty(target)) {
              const config = this.uploadConfigs[target];
              // check config ref matches uploads key
              if (uploads.hasOwnProperty(config.ref)) {
                const entries = uploads[config.ref].map((upload) => {
                  return new UploadEntry(upload, config);
                });
                config.setEntries(entries);
              }
            }
          }

          // TODO - check for _target variable from phx_change here and remove it from value?
          break;
        default:
          console.error("Unknown event type", type);
          return;
      }

      // package the event into a `LiveEvent` type
      const eventObj: AnyLiveEvent = {
        type: event,
        ...value,
      };

      // if the payload has a cid, then this event's target is a `LiveComponent`
      // NOTE: only "stateful" components can handle events!
      if (cid !== undefined) {
        // handleLiveComponentEvent()
        // console.log("LiveComponent event", type, cid, event, value);
        // find stateful component data by cid
        const statefulComponent = Object.values(this.statefulLiveComponents).find((c) => c.cid === cid);
        if (statefulComponent) {
          const { componentClass, context: oldContext, parts: oldParts, compoundId } = statefulComponent;
          // call event handler on stateful component instance
          const liveComponent = this.statefuleLiveComponentInstances[componentClass];
          if (liveComponent) {
            // socker for this live component instance
            const lcSocket = this.newLiveComponentSocket(structuredClone(oldContext) as LiveContext);

            // check for handleEvent and call it if it exists
            if (!liveComponent.handleEvent) {
              // istanbul ignore next
              console.error(`LiveComponent ${componentClass} with id ${cid} has not implemented handleEvent() method`);
            } else {
              // run handleEvent and render then update context for cid
              await liveComponent.handleEvent(eventObj, lcSocket);
            }

            // TODO optimization - if contexts are the same, don't re-render
            const newView = await liveComponent.render(lcSocket.context, { myself: cid });

            //diff the new view with the old view
            const newParts = deepDiff(oldParts, newView.partsTree(true));
            const changed = Object.keys(newParts).length > 0;
            // store state for subsequent loads
            this.statefulLiveComponents[compoundId] = {
              ...statefulComponent,
              context: lcSocket.context,
              parts: newView.partsTree(true),
              changed,
            };

            let diff: Parts = {
              c: {
                // use cid to identify component to update
                [`${cid}`]: newParts,
              },
            };

            diff = this.maybeAddEventsToParts(diff);

            // send message to re-render
            const replyPayload = {
              response: {
                diff,
              },
              status: "ok",
            };

            this.sendPhxReply(newPhxReply(message, replyPayload));

            // maybe send any queued info messages
            await this.maybeSendInfos();

            // remove temp data
            this.socket.updateContextWithTempAssigns();
          } else {
            // not sure how we'd get here but just in case - ignore test coverage though
            /* istanbul ignore next */
            console.error("Could not find stateful component instance for", componentClass);
            /* istanbul ignore next */
            return;
          }
        } else {
          console.error("Could not find stateful component for", cid);
          return;
        }
      }
      // event is not for LiveComponent rather it is for LiveView
      else {
        // console.log("LiveView event", type, event, value);
        // copy previous context
        const previousContext = structuredClone(this.socket.context);

        // do not call event handler for "lv:clear-flash" events
        let forceRerender = false;
        if (event !== "lv:clear-flash") {
          await this.liveView.handleEvent(eventObj, this.socket);
        } else {
          // ensure re-render happends even if context doesn't change
          forceRerender = true;
        }

        // skip ctxEqual for now
        // const ctxEqual = areConte xtsValueEqual(previousContext, this.socket.context);
        let diff: Parts = {};

        // only calc diff if contexts have changed
        // if (!ctxEqual || event === "lv:clear-flash") {
        // get old render tree and new render tree for diffing
        // TODO - check forceRerender here and skip diffing if not needed
        // const oldView = await this.liveView.render(previousContext, this.defaultLiveViewMeta());

        let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());

        // wrap in root template if there is one
        view = await this.maybeWrapInRootTemplate(view);

        // diff the new view with the old view
        const newParts = view.partsTree(true);
        diff = deepDiff(this._parts!, newParts);
        // store newParts for future diffs
        this._parts = newParts;

        diff = this.maybeAddPageTitleToParts(diff);
        diff = this.maybeAddEventsToParts(diff);

        const replyPayload = {
          response: {
            diff,
          },
          status: "ok",
        };

        this.sendPhxReply(newPhxReply(message, replyPayload));

        // maybe send any queued info messages
        await this.maybeSendInfos();

        // remove temp data
        this.socket.updateContextWithTempAssigns();
      }
    } catch (e) {
      /* istanbul ignore next */
      console.error("Error handling event", e);
    }
  }

  public async onAllowUpload(message: PhxAllowUploadIncoming): Promise<void> {
    try {
      const payload = message[PhxProtocol.payload];

      const { ref, entries } = payload;
      // console.log("onAllowUpload handle", ref, entries);
      this.activeUploadRef = ref;

      let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());

      // wrap in root template if there is one
      view = await this.maybeWrapInRootTemplate(view);

      // diff the new view with the old view
      const newParts = view.partsTree(true);
      let diff = deepDiff(this._parts!, newParts);
      // reset parts to new parts
      this._parts = newParts;

      // add the rest of the things
      diff = this.maybeAddPageTitleToParts(diff);
      diff = this.maybeAddEventsToParts(diff);

      // TODO allow configuration settings for server
      const config = {
        chunk_size: 64000, // 64kb
        max_entries: 10,
        max_file_size: 10 * 1024 * 1024, // 10MB
      };

      const entriesReply: { [key: string]: string } = {
        ref,
      };
      entries.forEach(async (entry) => {
        try {
          // this reply ends up been the "token" for the onPhxJoinUpload
          entriesReply[entry.ref] = JSON.stringify(entry);
        } catch (e) {
          // istanbul ignore next
          console.error("Error serializing entry", e);
        }
      });

      const replyPayload = {
        response: {
          diff,
          config,
          entries: entriesReply,
        },
        status: "ok",
      };

      this.sendPhxReply(newPhxReply(message, replyPayload));

      // maybe send any queued info messages
      await this.maybeSendInfos();

      // remove temp data
      this.socket.updateContextWithTempAssigns();
    } catch (e) {
      /* istanbul ignore next */
      console.error("Error handling allow_upload", e);
    }
  }

  public async onPhxJoinUpload(message: PhxJoinUploadIncoming): Promise<void> {
    try {
      const topic = message[PhxProtocol.topic];
      const payload = message[PhxProtocol.payload];

      const { token } = payload;
      // TODO? send more than ack?
      // perhaps we should check this token matches the entry sent earlier?

      const replyPayload = {
        response: {},
        status: "ok",
      };

      this.sendPhxReply(newPhxReply(message, replyPayload));
    } catch (e) {
      /* istanbul ignore next */
      console.error("Error handling onPhxJoinUpload", e);
    }
  }

  public async onUploadBinary(message: { data: Buffer }): Promise<void> {
    try {
      //console.log("onUploadBinary handle", message.data.length);

      // generate a random temp file path
      const randomTempFilePath = this.fileSystemAdaptor.tempPath(nanoid());

      const { joinRef, msgRef, topic, event, payload } = await new BinaryUploadSerDe().deserialize(message.data);

      this.fileSystemAdaptor.writeTempFile(randomTempFilePath, payload);
      // console.log("wrote temp file", randomTempFilePath, header.length, `"${header.toString()}"`);

      // split topic to get uploadRef
      const ref = topic.split(":")[1];

      // get activeUploadConfig by this.activeUploadRef
      const activeUploadConfig = Object.values(this.uploadConfigs).find((c) => c.ref === this.activeUploadRef);
      if (activeUploadConfig) {
        // find entry from topic ref
        const entry = activeUploadConfig.entries.find((e) => e.ref === ref);
        if (!entry) {
          // istanbul ignore next
          throw Error(`Could not find entry for ref ${ref} in uploadConfig ${JSON.stringify(activeUploadConfig)}`);
        }

        // use fileSystemAdaptor to get path to a temp file
        const entryTempFilePath = this.fileSystemAdaptor.tempPath(entry.uuid);
        // create or append to entry's temp file
        this.fileSystemAdaptor.createOrAppendFile(entryTempFilePath, randomTempFilePath);
        // tell the entry where it's temp file is
        entry.setTempFile(entryTempFilePath);
      }

      // TODO run diff at somepoint but not sure what would be different?
      const diffMessage: PhxOutgoingMessage<{}> = [joinRef, null, this.joinId, "diff", {}];
      let returnDiff = true;
      Object.keys(this.uploadConfigs).forEach((key) => {
        const config = this.uploadConfigs[key];
        // match upload config on the active upload ref
        if (config.ref === this.activeUploadRef) {
          // check if ref progress > 0
          config.entries.forEach((entry) => {
            if (entry.ref === ref) {
              returnDiff = entry.progress === 0;
            }
          });
        }
      });
      if (returnDiff) {
        this.sendPhxReply(diffMessage);
      }

      // now send lvu reply
      this.sendPhxReply([
        joinRef,
        msgRef,
        topic,
        "phx_reply",
        {
          response: {},
          status: "ok",
        },
      ]);
    } catch (e) {
      /* istanbul ignore next */
      console.error("Error handling onUploadBinary", e);
    }
  }

  public async onProgressUpload(message: PhxProgressUploadIncoming): Promise<void> {
    try {
      const payload = message[PhxProtocol.payload];

      const { ref, entry_ref, progress } = payload;
      // console.log("onProgressUpload handle", ref, entry_ref, progress);

      // iterate through uploadConfigs and find the one that matches the ref
      const uploadConfig = Object.values(this.uploadConfigs).find((config) => config.ref === ref);
      if (uploadConfig) {
        uploadConfig.entries = uploadConfig.entries.map((entry) => {
          if (entry.ref === entry_ref) {
            entry.updateProgress(progress);
          }
          return entry;
        });
        this.uploadConfigs[uploadConfig.name] = uploadConfig;
      } else {
        // istanbul ignore next
        console.error("Received progress upload but could not find upload config for ref", ref);
      }

      let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());

      // wrap in root template if there is one
      view = await this.maybeWrapInRootTemplate(view);

      // diff the new view with the old view
      const newParts = view.partsTree(true);
      let diff = deepDiff(this._parts!, newParts);
      // reset parts to new parts
      this._parts = newParts;

      // add the rest of the things
      diff = this.maybeAddPageTitleToParts(diff);
      diff = this.maybeAddEventsToParts(diff);

      const replyPayload = {
        response: {
          diff,
        },
        status: "ok",
      };

      this.sendPhxReply(newPhxReply(message, replyPayload));

      // maybe send any queued info messages
      await this.maybeSendInfos();

      // remove temp data
      this.socket.updateContextWithTempAssigns();
    } catch (e) {
      /* istanbul ignore next */
      console.error("Error handling allow_upload", e);
    }
  }

  /**
   * Handle's `live_patch` message from clients which denote change to the `LiveView`'s path parameters
   * and kicks off a re-render after calling `handleParams`.
   * @param message a `PhxLivePatchIncoming` message
   */
  public async onLivePatch(message: PhxLivePatchIncoming) {
    try {
      const payload = message[PhxProtocol.payload];

      const { url: urlString } = payload;
      const url = new URL(urlString);

      const previousContext = structuredClone(this.socket.context);
      await this.liveView.handleParams(url, this.socket);

      // get old render tree and new render tree for diffing
      // const oldView = await this.liveView.render(previousContext, this.defaultLiveViewMeta());
      let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());

      // wrap in root template if there is one
      view = await this.maybeWrapInRootTemplate(view);

      // TODO - why is the diff causing live_patch to fail??
      const newParts = view.partsTree(true);
      let diff = deepDiff(this._parts!, newParts);
      // reset parts to new parts
      this._parts = newParts;

      // add the rest of the things
      diff = this.maybeAddPageTitleToParts(diff);
      diff = this.maybeAddEventsToParts(diff);

      const replyPayload = {
        response: {
          diff,
        },
        status: "ok",
      };

      this.sendPhxReply(newPhxReply(message, replyPayload));

      // maybe send any queued info messages
      await this.maybeSendInfos();

      // remove temp data
      this.socket.updateContextWithTempAssigns();
    } catch (e) {
      /* istanbul ignore next */
      console.error("Error handling live_patch", e);
    }
  }

  /**
   * Responds to `heartbeat` message from clients by sending a `heartbeat` message back.
   * @param message
   */
  public onHeartbeat(message: PhxHeartbeatIncoming) {
    // TODO - monitor lastHeartbeat and shutdown if it's been too long?
    this.sendPhxReply(newHeartbeatReply(message));
  }

  /**
   * Handles `phx_leave` messages from clients which are sent when the client is leaves the `LiveView`
   * that is currently being rendered by navigating to a different `LiveView` or closing the browser.
   * @param message
   */
  public async onPhxLeave(message: PhxIncomingMessage<{}>) {
    await this.shutdown();
  }

  /**
   * Clean up any resources used by the `LiveView` and `LiveComponent` instances.
   */
  private async shutdown() {
    try {
      // unsubscribe from PubSubs
      Object.entries(this.subscriptionIds).forEach(async ([topic, subscriptionId]) => {
        const subId = await subscriptionId;
        await this.pubSub.unsubscribe(topic, subId);
      });

      // clear intervals
      this.intervals.forEach(clearInterval);
    } catch (e) {
      // ignore errors
    }
  }

  /**
   * Callback from `LiveSocket`s passed into `LiveView` and `LiveComponent` lifecycle methods (i.e. mount, handleParams,
   * handleEvent, handleInfo, update, etc) that enables a `LiveView` or `LiveComponent` to update the browser's
   * path and query string params.
   * @param path the path to patch
   * @param params the URLSearchParams to that will drive the new path query string params
   * @param replaceHistory whether to replace the current browser history entry or not
   */
  private async onPushPatch(path: string, params?: URLSearchParams, replaceHistory: boolean = false) {
    this.onPushNavigation("live_patch", path, params, replaceHistory);
  }

  /**
   * Callback from `LiveSocket`s passed into `LiveView` and `LiveComponent` lifecycle methods (i.e. mount, handleParams,
   * handleEvent, handleInfo, update, etc) that enables a `LiveView` or `LiveComponent` to redirect the browser to a
   * new path and query string params.
   * @param path the path to redirect to
   * @param params the URLSearchParams to that will be added to the redirect
   * @param replaceHistory whether to replace the current browser history entry or not
   */
  private async onPushRedirect(path: string, params?: URLSearchParams, replaceHistory: boolean = false) {
    this.onPushNavigation("live_redirect", path, params, replaceHistory);
  }

  /**
   * Common logic that handles both `live_patch` and `live_redirect` messages from clients.
   * @param navEvent the type of navigation event to handle: either `live_patch` or `live_redirect`
   * @param path the path to patch or to be redirected to
   * @param params the URLSearchParams to that will be added to the path
   * @param replaceHistory whether to replace the current browser history entry or not
   */
  private async onPushNavigation(
    navEvent: "live_redirect" | "live_patch",
    path: string,
    params?: URLSearchParams,
    replaceHistory: boolean = false
  ) {
    try {
      // construct the outgoing message
      const to = params ? `${path}?${params}` : path;
      const kind = replaceHistory ? "replace" : "push";
      const message: PhxOutgoingLivePatchPush = [
        null, // no join reference
        null, // no message reference
        this.joinId,
        navEvent,
        { kind, to },
      ];

      // to is relative so need to provide the urlBase determined on initial join
      this.url = new URL(to, this.url);

      // let the `LiveView` udpate its context based on the new url
      await this.liveView.handleParams(this.url, this.socket);

      // send the message
      this.sendPhxReply(message);

      // maybe send any queued info messages
      await this.maybeSendInfos();

      // remove temp data
      this.socket.updateContextWithTempAssigns();
    } catch (e) {
      /* istanbul ignore next */
      console.error(`Error handling ${navEvent}`, e);
    }
  }

  /**
   * Queues `AnyLivePushEvent` messages to be sent to the client on the subsequent `sendPhxReply` call.
   * @param pushEvent the `AnyLivePushEvent` to queue
   */
  private onPushEvent(pushEvent: AnyLivePushEvent) {
    // queue event
    this._events.push(pushEvent);
  }

  /**
   * Queues `AnyLiveInfo` messages to be sent to the LiveView until after the current lifecycle
   * @param info the AnyLiveInfo to queue
   */
  private onSendInfo(info: Info<AnyLiveInfo>) {
    // if info is a string, wrap it in an object
    if (typeof info === "string") {
      info = { type: info };
    }
    // queue info
    this._infoQueue.push(info);
  }

  /**
   * Handles sending `LiveInfo` events back to the `LiveView`'s `handleInfo` method.
   * @param info the `LiveInfo` event to dispatch to the `LiveView`
   */
  private async sendInternal(info: AnyLiveInfo): Promise<void> {
    try {
      await this.liveView.handleInfo(info, this.socket);

      // render the new view
      let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());

      // wrap in root template if there is one
      view = await this.maybeWrapInRootTemplate(view);

      // diff the render trees and save the new parts
      const newParts = view.partsTree(true);
      let diff = deepDiff(this._parts!, newParts);
      this._parts = newParts;

      diff = this.maybeAddPageTitleToParts(diff);
      diff = this.maybeAddEventsToParts(diff);

      const reply: PhxDiffReply = [
        null, // no join reference
        null, // no message reference
        this.joinId,
        "diff",
        diff,
      ];
      this.sendPhxReply(reply);

      // remove temp data
      this.socket.updateContextWithTempAssigns();
    } catch (e) {
      /* istanbul ignore next */
      console.error(`Error sending internal info`, e);
    }
  }

  private set pageTitle(newTitle: string) {
    if (this._pageTitle !== newTitle) {
      this._pageTitle = newTitle;
      this.pageTitleChanged = true;
    }
  }

  private async putFlash(key: string, value: string) {
    try {
      await this.flashAdaptor.putFlash(this.session, key, value);
    } catch (e) {
      /* istanbul ignore next */
      console.error(`Error putting flash`, e);
    }
  }

  private clearFlash(key: string) {
    try {
      this.flashAdaptor.clearFlash(this.session, key);
    } catch (e) {
      /* istanbul ignore next */
      console.error(`Error clearing flash`, e);
    }
  }

  private async maybeSendInfos() {
    if (this._infoQueue.length > 0) {
      const infos = this._infoQueue.splice(0, this._infoQueue.length);
      for (const info of infos) {
        await this.sendInternal(info);
      }
    }
  }

  private async maybeWrapInRootTemplate(view: HtmlSafeString) {
    if (this.liveViewRootTemplate) {
      return await this.liveViewRootTemplate(this.session, safe(view));
    }
    return view;
  }

  private maybeAddPageTitleToParts(parts: Parts) {
    if (this.pageTitleChanged) {
      this.pageTitleChanged = false; // reset
      return {
        ...parts,
        t: this._pageTitle,
      };
    }
    return parts;
  }

  private maybeAddEventsToParts(parts: Parts) {
    if (this._events.length > 0) {
      const events = structuredClone(this._events);
      this._events = []; // reset
      // map events to tuples of [type, values]
      const e = events.map((event) => {
        const { type, ...values } = event;
        return [type, values];
      });
      return {
        ...parts,
        e,
      };
    }
    return parts;
  }

  private sendPhxReply(reply: PhxOutgoingMessage<any>) {
    this.wsAdaptor.send(JSON.stringify(reply), (err) => {
      if (err) {
        this.shutdown();
        console.error(`Shutting down topic:${reply[2]}. For component:${this.liveView}. Error: ${err}`);
      }
    });
  }

  /**
   * Records for stateful components where key is a compound id `${componentName}_${componentId}`
   * and value is a tuple of [context, renderedPartsTree, changed, myself].
   *
   */
  private statefulLiveComponents: Record<string, StatefulLiveComponentData<unknown>> = {};

  private statefuleLiveComponentInstances: Record<string, LiveComponent<AnyLiveContext, AnyLiveInfo>> = {};

  /**
   * Collect all the LiveComponents first, group by their component type (e.g. instanceof),
   * then run single preload for all components of same type. then run rest of lifecycle
   * based on stateless or stateful.
   * @param liveComponent
   * @param params
   */
  private async liveComponentProcessor<TContext extends LiveContext>(
    liveComponent: LiveComponent<TContext>,
    params: Partial<TContext & { id?: number | string }> = {} as TContext
  ): Promise<LiveViewTemplate> {
    // console.log("liveComponentProcessor", liveComponent, params);
    // TODO - determine how to collect all the live components of the same type
    // and preload them all at once
    // Can get the types by `liveComponent.constructor.name` but
    // unclear how to determine if all the `live_component` tags have
    // been processed...  Perhaps `Parts` can track this?

    const { id } = params;
    delete params.id; // remove id from param to use as default context

    // concat all the component methods and hash them to get a unique component "class"
    let code = liveComponent.mount.toString() + liveComponent.update.toString() + liveComponent.render.toString();
    code = liveComponent.handleEvent ? code + liveComponent.handleEvent.toString() : code;
    const componentClass = crypto.createHash("sha256").update(code).digest("hex");

    // cache single instance of each component type
    if (!this.statefuleLiveComponentInstances[componentClass]) {
      this.statefuleLiveComponentInstances[componentClass] = liveComponent as LiveComponent<
        AnyLiveContext,
        AnyLiveEvent,
        AnyLiveInfo
      >;
    }

    // setup variables
    let context = structuredClone(params);
    let newView: LiveViewTemplate;

    // LiveComponents with "id" attributes are "stateful" which means the state of
    // context is maintained across multiple renders and it can "handleEvents"
    // Note: the id is how events are routed back to the `LiveComponent`
    if (id !== undefined) {
      // stateful `LiveComponent`
      // lifecycle is:
      //   On First Load:
      //   1. preload
      //   2. mount
      //   3. update
      //   4. render
      //   On Subsequent Loads:
      //   1. update
      //   2. render
      //   On Events:
      //   1. handleEvent
      //   2. render
      const compoundId = `${componentClass}_${id}`;
      let myself: number;
      if (this.statefulLiveComponents[compoundId] === undefined) {
        myself = ++this._cidIndex; // get next cid

        // setup socket
        const lcSocket = this.newLiveComponentSocket(structuredClone(context) as TContext);

        // first load lifecycle mount => update => render
        await liveComponent.mount(lcSocket);
        await liveComponent.update(lcSocket);
        newView = await liveComponent.render(lcSocket.context, { myself });
        // console.dir(newView);

        // store state for subsequent loads
        this.statefulLiveComponents[compoundId] = {
          context: lcSocket.context,
          parts: newView.partsTree(),
          changed: true,
          cid: myself,
          componentClass,
          compoundId,
        };
      } else {
        // subsequent loads lifecycle update => render
        // get state for this load
        const liveComponentData = this.statefulLiveComponents[compoundId];
        const { context: oldContext, parts: oldParts, cid } = liveComponentData;
        myself = cid;

        // setup socket
        const lcSocket = this.newLiveComponentSocket(structuredClone(oldContext) as TContext);

        // subsequent loads lifecycle update => render (no mount)
        await liveComponent.update(lcSocket);
        newView = await liveComponent.render(lcSocket.context, { myself });

        const newParts = deepDiff(oldParts, newView.partsTree(true));
        const changed = Object.keys(newParts).length > 0;

        // store state for subsequent loads
        this.statefulLiveComponents[compoundId] = {
          ...liveComponentData,
          context: lcSocket.context,
          parts: newView.partsTree(true),
          changed,
        };
      }
      // since stateful components are sent back as part of the render
      // tree (under the `c` key) we return an empty template here
      return new HtmlSafeString([String(myself)], [], true);
    } else {
      // No "id" so this is a "stateless" `LiveComponent`
      // lifecycle is:
      // 1. preload
      // 2. mount
      // 3. update
      // 4. render

      // warn user if `handleEvent` is implemented that it cannot be called
      if (liveComponent.handleEvent) {
        console.warn(`${liveComponent} has a handleEvent method but no "id" attribute so cannot be called.`);
      }

      // setup socket
      const lcSocket = this.newLiveComponentSocket(structuredClone(context) as TContext);

      // skipping preload for now... see comment above
      // first load lifecycle mount => update => render
      await liveComponent.mount(lcSocket);
      await liveComponent.update(lcSocket);
      newView = await liveComponent.render(lcSocket.context, { myself: id });
      // since this is stateless send back the LiveViewTemplate
      return newView;
    }
  }

  private maybeAddLiveComponentsToParts(parts: Parts) {
    const changedParts: Parts = {};
    // iterate over stateful components to find changed
    Object.values(this.statefulLiveComponents).forEach((componentData) => {
      if (componentData.changed) {
        const { cid, parts: cParts } = componentData;
        // changedParts key is the myself id
        changedParts[`${cid}`] = cParts;
      }
    });
    // if any stateful component changed
    if (Object.keys(changedParts).length > 0) {
      // reset changed by setting all changed to false
      Object.keys(this.statefulLiveComponents).forEach((compoundId) => {
        this.statefulLiveComponents[compoundId].changed = false;
      });

      // return parts with changed LiveComponents
      return {
        ...parts,
        c: changedParts,
      };
    }
    //TODO if no stateful components changed, remove cid references from parts tree?

    return parts;
  }

  defaultLiveViewMeta(): LiveViewMeta {
    return {
      csrfToken: this.csrfToken,
      live_component: async <TContext extends LiveContext = AnyLiveContext>(
        liveComponent: LiveComponent<TContext>,
        params?: Partial<TContext & { id: string | number }>
      ): Promise<LiveViewTemplate> => {
        return await this.liveComponentProcessor<TContext>(liveComponent, params);
      },
      url: this.url,
      uploads: this.uploadConfigs,
    } as LiveViewMeta;
  }

  private newLiveViewSocket() {
    return new WsLiveViewSocket(
      // id
      this.joinId,
      // url
      this.url,
      // pageTitleCallback
      (newTitle: string) => {
        this.pageTitle = newTitle;
      },
      // pushEventCallback
      (event) => this.onPushEvent(event),
      // pushPatchCallback
      async (path, params, replace) => await this.onPushPatch(path, params, replace),
      // pushRedirectCallback
      async (path, params, replace) => await this.onPushRedirect(path, params, replace),
      // putFlashCallback
      async (key, value) => await this.putFlash(key, value),
      // sendInfoCallback
      (info) => this.onSendInfo(info),
      // subscribeCallback
      async (topic: string) => {
        const subId = this.pubSub.subscribe<AnyLiveInfo>(topic, (info: AnyLiveInfo) => {
          this.sendInternal(info);
        });
        this.subscriptionIds[topic] = subId;
      },
      // allowUploadCallback
      async (name, options) => {
        // console.log("allowUpload", name, options);
        this.uploadConfigs[name] = new UploadConfig(name, options);
      },
      // cancelUploadCallback
      async (configName, ref) => {
        // console.log("cancelUpload", configName, ref);
        const uploadConfig = this.uploadConfigs[configName];
        if (uploadConfig) {
          uploadConfig.removeEntry(ref);
        } else {
          // istanbul ignore next
          console.warn(`Upload config ${configName} not found for cancelUpload`);
        }
      },
      // consumeUploadedEntriesCallback
      async <T>(configName: string, fn: (meta: ConsumeUploadedEntriesMeta, entry: UploadEntry) => Promise<T>) => {
        // console.log("consomeUploadedEntries", configName, fn);
        const uploadConfig = this.uploadConfigs[configName];
        if (uploadConfig) {
          const inProgress = uploadConfig.entries.some((entry) => !entry.done);
          if (inProgress) {
            throw new Error("Cannot consume entries while uploads are still in progress");
          }
          // noting is in progress so we can consume
          const entries = uploadConfig.consumeEntries();
          return await Promise.all(
            entries.map(
              async (entry) => await fn({ path: entry.getTempFile(), fileSystem: this.fileSystemAdaptor }, entry)
            )
          );
        }
        console.warn(`Upload config ${configName} not found for consumeUploadedEntries`);
        return [];
      },
      // uploadedEntriesCallback
      async (configName) => {
        // console.log("uploadedEntries", configName);
        const completed: UploadEntry[] = [];
        const inProgress: UploadEntry[] = [];
        const uploadConfig = this.uploadConfigs[configName];
        if (uploadConfig) {
          uploadConfig.entries.forEach((entry) => {
            if (entry.done) {
              completed.push(entry);
            } else {
              inProgress.push(entry);
            }
          });
        } else {
          // istanbul ignore next
          console.warn(`Upload config ${configName} not found for uploadedEntries`);
        }
        return {
          completed,
          inProgress,
        };
      }
    );
  }

  private newLiveComponentSocket<TContext extends LiveContext = AnyLiveContext>(context: TContext) {
    return new WsLiveComponentSocket(
      this.joinId,
      context,
      (info) => this.onSendInfo(info),
      (event) => this.onPushEvent(event)
    );
  }
}
