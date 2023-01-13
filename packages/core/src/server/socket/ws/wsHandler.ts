import { FileSystemAdaptor, FlashAdaptor, SerDe, WsAdaptor } from "../../adaptor";
import {
  AnyLiveContext,
  AnyLiveInfo,
  AnyLivePushEvent,
  LiveComponent,
  LiveContext,
  LiveView,
  LiveViewMeta,
  LiveViewRouter,
  LiveViewTemplate,
  LiveViewWrapperTemplate,
  matchRoute,
} from "../../live";
import { Phx } from "../../protocol/phx";
import { PhxReply } from "../../protocol/reply";
import { PubSub } from "../../pubsub";
import { SessionData } from "../../session";
import { deepDiff, Parts, safe } from "../../templates";
import { UploadConfig, UploadEntry } from "../../upload";
import { ConsumeUploadedEntriesMeta, WsLiveViewSocket } from "../liveSocket";
import { maybeAddStructuredClone } from "../structuredClone";
import { PhxJoinPayload } from "../types";
import { handleEvent } from "./wsEventHandler";
import { onAllowUpload, onProgressUpload, onUploadBinary } from "./wsUploadHandler";
maybeAddStructuredClone();

export interface WsHandlerConfig {
  serDe: SerDe;
  router: LiveViewRouter;
  fileSysAdaptor: FileSystemAdaptor;
  wrapperTemplate?: LiveViewWrapperTemplate;
  flashAdaptor: FlashAdaptor;
  pubSub: PubSub;
  onError?: (err: any) => void;
  debug?(msg: string): void;
}

export class WsHandlerContext {
  #liveView: LiveView;
  #socket: WsLiveViewSocket;
  #joinId: string;
  #csrfToken: string;
  #pageTitle?: string;
  #pageTitleChanged: boolean = false;
  #flash: FlashAdaptor;
  #sessionData: SessionData;
  url: URL;
  pushEvents: AnyLivePushEvent[] = [];
  activeUploadRef: string | null = null;
  uploadConfigs: { [key: string]: UploadConfig } = {};
  parts: Parts = {};

  constructor(
    liveView: LiveView,
    socket: WsLiveViewSocket,
    joinId: string,
    csrfToken: string,
    url: URL,
    sessionData: SessionData,
    flash: FlashAdaptor
  ) {
    this.#liveView = liveView;
    this.#socket = socket;
    this.#joinId = joinId;
    this.#csrfToken = csrfToken;
    this.url = url;
    this.#sessionData = sessionData;
    this.#flash = flash;
  }

  get liveView() {
    return this.#liveView;
  }

  get socket() {
    return this.#socket;
  }

  get joinId() {
    return this.#joinId;
  }

  get csrfToken() {
    return this.#csrfToken;
  }

  set pageTitle(newTitle: string) {
    if (this.#pageTitle !== newTitle) {
      this.#pageTitle = newTitle;
      this.#pageTitleChanged = true;
    }
  }

  get hasPageTitleChanged() {
    return this.#pageTitleChanged;
  }

  get pageTitle() {
    this.#pageTitleChanged = false;
    return this.#pageTitle ?? "";
  }

  get sessionData() {
    return this.#sessionData;
  }

  defaultLiveViewMeta(): LiveViewMeta {
    return {
      csrfToken: this.csrfToken,
      live_component: async <TContext extends LiveContext = AnyLiveContext>(
        liveComponent: LiveComponent<TContext>,
        params?: Partial<TContext & { id: string | number }>
      ): Promise<LiveViewTemplate> => {
        // TODO - reimplement live components
        throw new Error("Not implemented");
      },
      url: this.url,
      uploads: this.uploadConfigs,
    } as LiveViewMeta;
  }

  clearFlash(key: string) {
    return this.#flash.clearFlash(this.#sessionData, key);
  }
}

export class WsHandler {
  #ws: WsAdaptor;
  #config: WsHandlerConfig;
  #ctx?: WsHandlerContext;
  #activeMsg: boolean = false;
  #msgQueue: Phx.Msg<unknown>[] = [];
  #subscriptionIds: { [key: string]: string } = {};
  #hbInterval?: NodeJS.Timeout;
  #lastHB?: number;

  constructor(ws: WsAdaptor, config: WsHandlerConfig) {
    this.#config = config;
    this.#ws = ws;
    this.#ws.subscribeToMessages(async (data: Buffer, isBinary: boolean) => {
      try {
        if (isBinary) {
          await this.handleMsg(Phx.parseBinary(data));
          return;
        }
        await this.handleMsg(Phx.parse(data.toString()));
      } catch (e) {
        console.error("error parsing Phx message", e);
      }
    });
    this.#ws.subscribeToClose(() => this.close);
  }

  async handleMsg(msg: Phx.Msg<unknown>) {
    if (this.#config.debug) {
      try {
        this.#config.debug(JSON.stringify(msg));
      } catch (e) {
        console.error("error debugging message", e);
      }
    }
    try {
      // attempt to prevent race conditions by queuing messages
      // if we are already processing a message
      if (this.#activeMsg) {
        this.#msgQueue.push(msg);
        return;
      }
      this.#activeMsg = true;
      const event = msg[Phx.MsgIdx.event];
      const topic = msg[Phx.MsgIdx.topic];
      switch (event) {
        case "phx_join":
          // phx_join event used for both LiveView joins and LiveUpload joins
          // check prefix of topic to determine if LiveView (lv:*) or LiveViewUpload (lvu:*)
          if (topic.startsWith("lv:")) {
            const payload = msg[Phx.MsgIdx.payload] as unknown as PhxJoinPayload;

            // figure out if we are using url or redirect for join URL
            const { url: urlString, redirect: redirectString } = payload;
            if (urlString === undefined && redirectString === undefined) {
              throw new Error("Join message must have either a url or redirect property");
            }

            // checked one of these was defined in MessageRouter
            const url = new URL((urlString || redirectString)!);

            // route to the LiveView based on the URL
            const matchResult = matchRoute(this.#config.router, url.pathname);
            if (!matchResult) {
              throw Error(`no LiveView found for ${url}`);
            }
            // Found a match! so let's keep going
            const [liveView, pathParams] = matchResult;

            // extract params, session and socket from payload
            const { params: payloadParams, session: payloadSession, static: payloadStatic } = payload;

            // attempt to deserialize session
            const sessionData = await this.#config.serDe.deserialize(payloadSession);
            // if session csrfToken does not match payload csrfToken, reject join
            if (sessionData._csrf_token !== payloadParams._csrf_token) {
              console.error(
                "Rejecting join due to mismatched csrfTokens",
                sessionData._csrf_token,
                payloadParams._csrf_token
              );
              return;
            }

            // success! now let's initialize this liveview
            const socket = this.newLiveViewSocket(topic, url);
            this.#ctx = new WsHandlerContext(
              liveView,
              socket,
              topic, // aka joinId
              payloadParams._csrf_token,
              url,
              sessionData,
              this.#config.flashAdaptor
            );

            // run initial lifecycle steps for the liveview: mount => handleParams => render
            await this.#ctx.liveView.mount(this.#ctx.socket, sessionData, { ...payloadParams, ...pathParams.params });
            await this.#ctx.liveView.handleParams(url, this.#ctx.socket);
            const view = await this.#ctx.liveView.render(this.#ctx.socket.context, this.newLiveViewMeta());

            // convert the view into a parts tree
            const rendered = await this.viewToRendered(view);

            // send the response and cleanup
            this.send(PhxReply.renderedReply(msg, rendered));
            this.cleanupPostReply();
            // start heartbeat interval
            this.#lastHB = Date.now();
            this.#hbInterval = setInterval(() => {
              // shutdown if we haven't received a heartbeat in 60 seconds
              if (this.#lastHB && Date.now() - this.#lastHB > 60000) {
                this.#hbInterval && clearInterval(this.#hbInterval);
                this.close();
              }
            }, 30000);
          } else if (topic.startsWith("lvu:")) {
            // const payload = msg[Phx.MsgIdx.payload] as Phx.JoinUploadPayload;
            // perhaps we should check this token matches entries send in the "allow_upload" event?
            // const { token } = payload;
            // send ACK
            // TODO? send more than ack? what?
            this.send(PhxReply.renderedReply(msg, {}));
          } else {
            // istanbul ignore next
            throw new Error(`Unknown phx_join prefix: ${topic}`);
          }
          break;
        case "event":
          try {
            const payload = msg[Phx.MsgIdx.payload] as Phx.EventPayload;
            const view = await handleEvent(this.#ctx!, payload);
            const diff = await this.viewToDiff(view);
            this.send(PhxReply.diffReply(msg, diff));
            this.cleanupPostReply();
          } catch (e) {
            console.error("error handling event", e);
          }
          break;
        case "info":
          try {
            const payload = msg[Phx.MsgIdx.payload] as AnyLiveInfo;
            // lifecycle handleInfo => render
            await this.#ctx!.liveView.handleInfo(payload, this.#ctx!.socket);
            const view = await this.#ctx!.liveView.render(this.#ctx!.socket.context, this.#ctx!.defaultLiveViewMeta());
            const diff = await this.viewToDiff(view);
            this.send(PhxReply.diff(null, this.#ctx!.joinId, diff));
            this.cleanupPostReply();
          } catch (e) {
            /* istanbul ignore next */
            console.error(`Error sending internal info`, e);
          }
          break;
        case "live_redirect":
          const payload = msg[Phx.MsgIdx.payload] as Phx.LiveNavPushPayload;
          const { to } = payload;
          // to is relative so need to provide the urlBase determined on initial join
          this.#ctx!.url = new URL(to, this.#ctx!.url);
          // let the `LiveView` udpate its context based on the new url
          await this.#ctx!.liveView.handleParams(this.#ctx!.url, this.#ctx!.socket);
          // send the message on to the client
          this.send(msg as PhxReply.Reply);
          break;
        case "live_patch":
          // two cases of live_patch: server-side (pushPatch) or client-side (click on link)
          try {
            const payload = msg[Phx.MsgIdx.payload] as Phx.LivePatchPayload | Phx.LiveNavPushPayload;
            if (payload.hasOwnProperty("url")) {
              // case 1: client-side live_patch
              const url = new URL((payload as Phx.LivePatchPayload).url);
              this.#ctx!.url = url;
              await this.#ctx!.liveView.handleParams(url, this.#ctx!.socket);
              const view = await this.#ctx!.liveView.render(
                this.#ctx!.socket.context,
                this.#ctx!.defaultLiveViewMeta()
              );
              const diff = await this.viewToDiff(view);
              this.send(PhxReply.diffReply(msg, diff));
              this.cleanupPostReply();
            } else {
              // case 2: server-side live_patch
              const { to } = payload as Phx.LiveNavPushPayload;
              // to is relative so need to provide the urlBase determined on initial join
              this.#ctx!.url = new URL(to, this.#ctx!.url);
              // let the `LiveView` udpate its context based on the new url
              await this.#ctx!.liveView.handleParams(this.#ctx!.url, this.#ctx!.socket);
              // send the message on to the client
              this.send(msg as PhxReply.Reply);
            }
          } catch (e) {
            /* istanbul ignore next */
            console.error("Error handling live_patch", e);
          }
          break;
        // Start File Upload Events
        case "allow_upload":
          try {
            const payload = msg[Phx.MsgIdx.payload] as Phx.AllowUploadPayload;
            const { view, config, entries } = await onAllowUpload(this.#ctx!, payload);
            const diff = await this.viewToDiff(view);
            this.send(PhxReply.allowUploadReply(msg, diff, config, entries));
          } catch (e) {
            console.error("error handling allow_upload", e);
          }
          break;
        case "progress":
          try {
            const payload = msg[Phx.MsgIdx.payload] as Phx.ProgressUploadPayload;
            const view = await onProgressUpload(this.#ctx!, payload);
            const diff = await this.viewToDiff(view);
            this.send(PhxReply.diffReply(msg, diff));
            this.cleanupPostReply();
          } catch (e) {
            console.error("error handling progress", e);
          }
          break;
        case "chunk":
          try {
            const replies = await onUploadBinary(this.#ctx!, msg as Phx.Msg<Buffer>, this.#config.fileSysAdaptor);
            for (const reply of replies) {
              this.send(reply);
            }
          } catch (e) {
            console.error("error handling chunk", e);
          }
          break;
        // End File Upload Events
        case "heartbeat":
          this.#lastHB = Date.now();
          this.send(PhxReply.heartbeat(msg));
          break;
        case "phx_leave":
          try {
            // stop the heartbeat
            if (this.#hbInterval) {
              clearInterval(this.#hbInterval);
            }
          } catch (e) {
            console.error("error stopping heartbeat", e);
          }
          try {
            // shutdown the liveview
            if (this.#ctx) {
              await this.#ctx.liveView.shutdown(this.#ctx.joinId, this.#ctx);
              // clear out the context
              this.#ctx = undefined;
            }
          } catch (e) {
            console.error("error shutting down liveview:" + this.#ctx?.joinId, e);
          }

          try {
            // unsubscribe from PubSubs
            Object.entries(this.#subscriptionIds).forEach(async ([topic, subId]) => {
              await this.#config.pubSub.unsubscribe(topic, subId);
            });
          } catch (e) {
            console.error("error unsubscribing from pubsub", e);
          }
          break;
        default:
          throw new Error(`unexpected phx protocol event ${event}`);
      }

      // we're done with this message, so we can process the next one if there is one
      this.#activeMsg = false;
      const nextMsg = this.#msgQueue.pop();
      if (nextMsg) {
        this.handleMsg(nextMsg);
      }
    } catch (e) {
      this.maybeHandleError(e);
    }
  }

  async close() {
    // redirect this through handleMsg after adding the joinId
    const joinId = this.#ctx?.joinId ?? "unknown";
    this.handleMsg([null, null, joinId, "phx_leave", null]);
  }

  send(reply: PhxReply.Reply) {
    try {
      this.#ws.send(PhxReply.serialize(reply), this.maybeHandleError);
    } catch (e) {
      this.maybeHandleError(e);
    }
  }

  private maybeHandleError(err: any) {
    if (err && this.#config.onError) {
      this.#config.onError(err);
    }
  }

  private async cleanupPostReply() {
    // do post-send lifecycle step
    this.#ctx!.socket.updateContextWithTempAssigns();
  }

  private async viewToDiff(view: LiveViewTemplate): Promise<Parts> {
    // wrap in root template if there is one
    view = await this.maybeWrapView(view);

    // diff the new view with the old view
    const newParts = view.partsTree(true);
    let diff = deepDiff(this.#ctx!.parts, newParts);
    // store newParts for future diffs
    this.#ctx!.parts = newParts;

    // TODO
    diff = this.maybeAddEventsToParts(diff);
    return this.maybeAddTitleToView(diff);
  }

  private async viewToRendered(view: LiveViewTemplate): Promise<Parts> {
    // step 1: if provided, wrap the rendered `LiveView` inside the root template
    view = await this.maybeWrapView(view);

    // step 2: store parts for later diffing after rootTemplate is applied
    let parts = view.partsTree(true);

    // TODO
    // step 3: add any `LiveComponent` renderings to the parts tree
    // let rendered = this.maybeAddLiveComponentsToParts(parts);

    parts = this.maybeAddEventsToParts(parts);

    // step 4: if set, add the page title to the parts tree
    parts = this.maybeAddTitleToView(parts);

    // set the parts tree on the context
    this.#ctx!.parts = parts;

    return parts;
  }

  private maybeAddEventsToParts(parts: Parts) {
    if (this.#ctx!.pushEvents.length > 0) {
      const events = structuredClone(this.#ctx!.pushEvents);
      this.#ctx!.pushEvents = []; // reset
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

  private maybeAddTitleToView(parts: Parts) {
    if (this.#ctx!.hasPageTitleChanged) {
      const t = this.#ctx!.pageTitle; // resets changed flag
      parts = {
        ...parts,
        t,
      };
    }
    return parts;
  }

  private async maybeWrapView(view: LiveViewTemplate) {
    if (this.#config.wrapperTemplate) {
      view = await this.#config.wrapperTemplate(this.#ctx!.sessionData, safe(view));
    }
    return view;
  }

  // LiveViewMeta
  private newLiveViewMeta(): LiveViewMeta {
    return {
      csrfToken: this.#ctx!.csrfToken,
      // live_component: async <TContext extends LiveContext = AnyLiveContext>(
      //   liveComponent: LiveComponent<TContext>,
      //   params?: Partial<TContext & { id: string | number }>
      // ): Promise<LiveViewTemplate> => {
      //   return await this.liveComponentProcessor<TContext>(liveComponent, params);
      // },
      url: this.#ctx!.url,
      uploads: this.#ctx!.uploadConfigs,
    } as LiveViewMeta;
  }

  private async pushNav(
    navEvent: "live_redirect" | "live_patch",
    path: string,
    params?: URLSearchParams,
    replaceHistory: boolean = false
  ) {
    try {
      // construct the outgoing message
      const to = params ? `${path}?${params}` : path;
      const kind = replaceHistory ? "replace" : "push";
      const msg: Phx.Msg<Phx.LiveNavPushPayload> = [
        null, // no join reference
        null, // no message reference
        this.#ctx!.joinId,
        navEvent,
        { kind, to },
      ];
      // send this back through handleMsg
      this.handleMsg(msg);
    } catch (e) {
      /* istanbul ignore next */
      console.error(`Error handling ${navEvent}`, e);
    }
  }

  // liveview socket methods
  // TODO move this to context?
  private newLiveViewSocket(joinId: string, url: URL) {
    return new WsLiveViewSocket(
      // id
      joinId,
      // url
      url,
      // pageTitleCallback
      (newTitle: string) => {
        this.#ctx!.pageTitle = newTitle;
      },
      // pushEventCallback
      (pushEvent) => {
        this.#ctx!.pushEvents.push(pushEvent);
      },
      // pushPatchCallback
      async (path, params, replace) => {
        await this.pushNav("live_patch", path, params, replace);
      },
      // pushRedirectCallback
      async (path, params, replace) => {
        await this.pushNav("live_redirect", path, params, replace);
      },
      // putFlashCallback
      async (key, value) => {
        await this.#config.flashAdaptor.putFlash(this.#ctx!.sessionData, key, value);
      },
      // sendInfoCallback
      (info) => {
        // info can be a string or an object so check it
        // if it's a string, we need to convert it to a LiveInfo object
        if (typeof info === "string") {
          info = { type: info };
        }
        this.handleMsg([null, null, this.#ctx!.joinId, "info", info] as Phx.Msg);
      },
      // subscribeCallback
      async (topic: string) => {
        const subId = await this.#config.pubSub.subscribe<AnyLiveInfo>(topic, (info: AnyLiveInfo) => {
          // dispatch as an "info" message
          this.handleMsg([null, null, this.#ctx!.joinId, "info", info] as Phx.Msg);
        });
        this.#subscriptionIds[topic] = subId;
      },
      // allowUploadCallback
      async (name, options) => {
        this.#ctx!.uploadConfigs[name] = new UploadConfig(name, options);
      },
      // cancelUploadCallback
      async (configName, ref) => {
        const uploadConfig = this.#ctx!.uploadConfigs[configName];
        if (uploadConfig) {
          uploadConfig.removeEntry(ref);
        } else {
          // istanbul ignore next
          console.warn(`Upload config ${configName} not found for cancelUpload`);
        }
      },
      // consumeUploadedEntriesCallback
      async <T>(configName: string, fn: (meta: ConsumeUploadedEntriesMeta, entry: UploadEntry) => Promise<T>) => {
        const uploadConfig = this.#ctx!.uploadConfigs[configName];
        if (uploadConfig) {
          const inProgress = uploadConfig.entries.some((entry) => !entry.done);
          if (inProgress) {
            throw new Error("Cannot consume entries while uploads are still in progress");
          }
          // noting is in progress so we can consume
          const entries = uploadConfig.consumeEntries();
          return await Promise.all(
            entries.map(
              async (entry) => await fn({ path: entry.getTempFile(), fileSystem: this.#config.fileSysAdaptor }, entry)
            )
          );
        }
        console.warn(`Upload config ${configName} not found for consumeUploadedEntries`);
        return [];
      },
      // uploadedEntriesCallback
      async (configName) => {
        const completed: UploadEntry[] = [];
        const inProgress: UploadEntry[] = [];
        const uploadConfig = this.#ctx!.uploadConfigs[configName];
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
}
