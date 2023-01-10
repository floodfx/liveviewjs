import { nanoid } from "nanoid";
import { FileSystemAdaptor, SerDe, WsAdaptor } from "../adaptor";
import {
  AnyLiveInfo,
  LiveView,
  LiveViewMeta,
  LiveViewRouter,
  LiveViewTemplate,
  LiveViewWrapperTemplate,
  matchRoute,
} from "../live";
import { Phx } from "../protocol/phx";
import { PhxReply } from "../protocol/reply";
import { SessionData } from "../session";
import { Parts, safe } from "../templates";
import { UploadConfig, UploadEntry } from "../upload";
import { ConsumeUploadedEntriesMeta, Info, WsLiveViewSocket } from "./liveSocket";
import { PhxJoinPayload } from "./types";

export interface WsHandlerConfig {
  serDe: SerDe;
  router: LiveViewRouter;
  fileSysAdaptor: FileSystemAdaptor;
  wrapperTemplate?: LiveViewWrapperTemplate;
}

class LiveViewContext {
  #joinId: string;
  #csrfToken: string;
  #url: URL;
  #pageTitle?: string;
  #pageTitleChanged: boolean = false;
  sessionData: SessionData;
  uploadConfigs: { [key: string]: UploadConfig } = {};
  parts: Parts = {};

  constructor(joinId: string, csrfToken: string, url: URL, sessionData: SessionData) {
    this.#joinId = joinId;
    this.#csrfToken = csrfToken;
    this.#url = url;
    this.sessionData = sessionData;
  }

  get joinId() {
    return this.#joinId;
  }

  get csrfToken() {
    return this.#csrfToken;
  }

  get url() {
    return this.#url;
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
}

export class WsHandler {
  #ws: WsAdaptor;
  #config: WsHandlerConfig;
  #ctx?: LiveViewContext;
  #liveView?: LiveView;
  #socket?: WsLiveViewSocket;
  #connectionId: string;

  constructor(ws: WsAdaptor, config: WsHandlerConfig) {
    this.#connectionId = nanoid();
    this.#config = config;
    this.#ws = ws;
    this.#ws.subscribeToMessages(async (data: Buffer, isBinary: boolean) => {
      try {
        if (isBinary) {
          await this.handleUpload(Phx.parseBinary(data));
        }
        await this.handleMsg(Phx.parse(data.toString()));
      } catch (e) {
        console.error("error parsing Phx message", e);
      }
    });
    this.#ws.subscribeToClose(this.handleClose);
  }

  async handleMsg(msg: Phx.Msg) {
    console.log("dispatch", msg);
    const event = msg[Phx.MsgIdx.event];
    const topic = msg[Phx.MsgIdx.topic];
    try {
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
            this.#liveView = liveView;
            this.#ctx = new LiveViewContext(topic, payloadParams._csrf_token, url, sessionData);
            this.#socket = this.newLiveViewSocket();

            // run initial lifecycle steps for the liveview: mount => handleParams => render
            await this.#liveView.mount(this.#socket, sessionData, { ...payloadParams, ...pathParams.params });
            await this.#liveView.handleParams(url, this.#socket);
            const view = await this.#liveView.render(this.#socket.context, this.newLiveViewMeta());

            // convert the view into a parts tree
            const rendered = await this.viewToParts(view);

            // build response from parts and message
            const reply = PhxReply.renderedReply(msg, rendered);

            // send the response
            this.send(reply);

            // do post-send lifecycle step
            this.#socket.updateContextWithTempAssigns();
          } else if (topic.startsWith("lvu:")) {
            // since we don't have the lv topic id, use the connectionId to broadcast to the component manager
            // await this.pubSub.broadcast(connectionId, {
            //   type: "phx_join_upload",
            //   message: rawPhxMessage as PhxJoinUploadIncoming,
            // });
          } else {
            // istanbul ignore next
            throw new Error(`Unknown phx_join prefix: ${topic}`);
          }
          break;
        case "heartbeat":
          this.send(PhxReply.hbReply(msg));
          break;
        case "event":
        case "live_patch":
        case "phx_leave":
        case "allow_upload":
        case "progress":
          break;
        default:
          throw new Error(`unexpected phx protocol event ${event}`);
      }
    } catch (e) {
      console.error("error handling phx message", e);
    }
  }

  handleUpload(msg: Phx.UploadMsg) {
    console.log("upload", msg);
  }

  handleInfo(msg: Info<AnyLiveInfo>) {
    console.log("info", msg);
  }

  async handleClose() {
    console.log("close");
    // await this.#liveView?.unmount(this.#socket);
  }

  send(reply: PhxReply.Reply) {
    this.#ws.send(PhxReply.serialize(reply));
  }

  private async viewToParts(view: LiveViewTemplate): Promise<Parts> {
    // step 1: if provided, wrap the rendered `LiveView` inside the root template
    if (this.#config.wrapperTemplate) {
      view = await this.#config.wrapperTemplate(this.#ctx!.sessionData, safe(view));
    }

    // step 2: store parts for later diffing after rootTemplate is applied
    let parts = view.partsTree(true);

    // TODO
    // step 3: add any `LiveComponent` renderings to the parts tree
    // let rendered = this.maybeAddLiveComponentsToParts(parts);

    // step 4: if set, add the page title to the parts tree
    if (this.#ctx!.hasPageTitleChanged) {
      const t = this.#ctx!.pageTitle; // resets changed flag
      parts = {
        ...parts,
        t,
      };
    }

    // set the parts tree on the context
    this.#ctx!.parts = parts;

    return parts;
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

  // liveview socket methods

  private newLiveViewSocket() {
    return new WsLiveViewSocket(
      // id
      this.#ctx!.joinId,
      // pageTitleCallback
      (newTitle: string) => {
        this.#ctx!.pageTitle = newTitle;
      },
      // pushEventCallback
      (event) => {},
      // pushPatchCallback
      async (path, params, replace) => {},
      // pushRedirectCallback
      async (path, params, replace) => {},
      // putFlashCallback
      async (key, value) => {},
      // repeatCallback
      (fn, intervalMillis) => {},
      // sendInfoCallback
      (info) => this.handleInfo(info),
      // subscribeCallback
      async (topic: string) => {},
      // allowUploadCallback
      async (name, options) => {
        // console.log("allowUpload", name, options);
        this.#ctx!.uploadConfigs[name] = new UploadConfig(name, options);
      },
      // cancelUploadCallback
      async (configName, ref) => {
        // console.log("cancelUpload", configName, ref);
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
        // console.log("consomeUploadedEntries", configName, fn);
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
        // console.log("uploadedEntries", configName);
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
