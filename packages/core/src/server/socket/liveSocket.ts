import { FileSystemAdaptor } from "../adaptor";
import { AnyLiveContext, AnyLiveInfo, AnyLivePushEvent, LiveContext, LiveInfo } from "../live";
import { UploadConfig, UploadEntry } from "../upload";
import { UploadConfigOptions } from "../upload/uploadConfig";
import { maybeAddStructuredClone } from "./structuredClone";
maybeAddStructuredClone();

/**
 *  Type that enables Info events to be passed as plain strings
 */
export type Info<TInfo extends LiveInfo> = TInfo["type"] | TInfo;

/**
 * The type passed to the `consumeUploadedEntries` callback's "meta" parameter
 */
export type ConsumeUploadedEntriesMeta = {
  /**
   * The location of the file on the server
   */
  path: string;
  /**
   * The FileSystemAdaptor for the platform (node or deno)
   */
  fileSystem: FileSystemAdaptor;
};

/**
 * Main interface to update state, interact, message, and otherwise
 * manage the lifecycle of a `LiveView`.
 *
 * The `LiveView` API (i.e. `mount`, `handleParams`, `handleInfo`, `handleEvent`)
 * are all passed `LiveViewSocket` which provide access to the current `LiveView`
 * context (via `context`) as well as various methods update the `LiveView` including
 * `assign` which updates the `LiveView`'s context (i.e. state).
 */
export interface LiveViewSocket<TContext extends LiveContext = AnyLiveContext, TInfos extends LiveInfo = AnyLiveInfo> {
  /**
   * The id of the `LiveView`
   */
  readonly id: string;
  /**
   * Whether the websocket is connected.
   * true if connected to a websocket, false for http request
   */
  readonly connected: boolean;
  /**
   * The current context (i.e. state) of the `LiveView`
   */
  readonly context: TContext;
  /**
   * The current URL of the `LiveView`
   */
  readonly url: URL;
  /**
   * `assign` is used to update the context (i.e. state) of the `LiveComponent`
   * @param context a `Partial` of the LiveView's context to update
   */
  assign(context: Partial<TContext>): void;
  /**
   * Marks any set properties as temporary and will be reset to the given
   * value after the next render cycle.  Typically used to ensure large but
   * infrequently updated values are not kept in memory.
   *
   * @param context a partial of the context that should be temporary and the value to reset it to
   */
  tempAssign(context: Partial<TContext>): void;
  /**
   * Updates the `<title>` tag of the `LiveView` page.  Requires using the
   * `live_title` helper in rendering the page.
   *
   * @param newPageTitle the new text value of the page - note the prefix and suffix will not be changed
   */
  pageTitle(newPageTitle: string): void;
  /**
   * Pushes and event (possibly with data) from the server to the client.  Requires
   * either a `window.addEventListener` defined for that event or a client `Hook`
   * to be defined and to be listening for the event via `this.handleEvent` callback.
   *
   * @param pushEvent the event to push to the client
   */
  pushEvent(pushEvent: AnyLivePushEvent): void;
  /**
   * Updates the LiveView's browser URL with the given path and query parameters.
   *
   * @param path the path whose query params are being updated
   * @param params the query params to update the path with
   * @param replaceHistory whether to replace the current history entry or push a new one (defaults to false)
   */
  pushPatch(path: string, params?: URLSearchParams, replaceHistory?: boolean): Promise<void>;
  /**
   * Shutdowns the current `LiveView`and loads another `LiveView`in its place
   * without reloading the whole page (i.e. making a full HTTP request).  Can be
   * used to remount the current `LiveView`if need be. Use `pushPatch` to update the
   * current `LiveView`without unloading and remounting.
   *
   * @param path the path whose query params are being updated
   * @param params the query params to update the path with
   * @param replaceHistory whether to replace the current history entry or push a new one (defaults to false)
   */
  pushRedirect(path: string, params?: URLSearchParams, replaceHistory?: boolean): Promise<void>;
  /**
   * Add flash to the socket for a given key and value.
   * @param key the key to add the flash to
   * @param value the flash value
   */
  putFlash(key: string, value: string): Promise<void>;
  /**
   * Send an internal event (a.k.a "Info") to the LiveView's `handleInfo` method
   *
   * @param event the event to send to `handleInfo`
   */
  sendInfo(info: Info<TInfos>): void;
  /**
   * Subscribe to the given topic using pub/sub. Events published to this topic
   * will be delivered to `handleInfo`.
   *
   * @param topic the topic to subscribe this `LiveView`to
   */
  subscribe(topic: string): Promise<void>;
  /**
   * Allows file uploads for the given `LiveView`and configures the upload
   * options (filetypes, size, etc).
   * @param name the name of the upload
   * @param options the options for the upload (optional)
   */
  allowUpload(name: string, options?: UploadConfigOptions): Promise<void>;
  /**
   * Cancels the file upload for a given UploadConfig by config name and file ref.
   * @param name the name of the upload from which to cancel
   * @param ref the ref of the upload entry to cancel
   */
  cancelUpload(configName: string, ref: string): Promise<void>;
  /**
   * Consume the uploaded files for a given UploadConfig (by name). This
   * should only be called after the form's "save" event has occurred which
   * guarantees all the files for the upload have been fully uploaded.
   * @param name the name of the upload from which to consume
   * @param fn the callback to run for each entry
   * @returns an array of promises based on the return type of the callback function
   * @throws if any of the entries are not fully uploaded (i.e. completed)
   */
  consumeUploadedEntries<T>(
    configName: string,
    fn: (meta: ConsumeUploadedEntriesMeta, entry: UploadEntry) => Promise<T>
  ): Promise<T[]>;
  /**
   * Returns two sets of files that are being uploaded, those `completed` and
   * those `inProgress` for a given UploadConfig (by name).  Unlike `consumeUploadedEntries`,
   * this does not require the form's "save" event to have occurred and will not
   * throw if any of the entries are not fully uploaded.
   * @param name the name of the upload from which to get the entries
   * @returns an object with `completed` and `inProgress` entries
   */
  uploadedEntries(configName: string): Promise<{
    completed: UploadEntry[];
    inProgress: UploadEntry[];
  }>;
}

abstract class BaseLiveViewSocket<TContext extends LiveContext = AnyLiveContext, TInfo extends LiveInfo = AnyLiveInfo>
  implements LiveViewSocket<TContext, TInfo>
{
  abstract url: URL;
  abstract connected: boolean;
  abstract id: string;

  private _context: TContext;
  private _tempContext: Partial<TContext> = {}; // values to reset the context to post render cycle

  get context(): TContext {
    return structuredClone(this._context || ({} as TContext));
  }

  assign(context: Partial<TContext>) {
    this._context = {
      ...this.context,
      ...context,
    };
  }

  tempAssign(tempContext: Partial<TContext>) {
    this._tempContext = {
      ...this._tempContext,
      ...tempContext,
    };
  }

  pageTitle(newPageTitle: string) {
    // no-op
  }
  pushEvent(pushEvent: AnyLivePushEvent) {
    // no-op
  }
  pushPatch(path: string, params?: URLSearchParams, replaceHistory?: boolean) {
    // no-op
    // istanbul ignore next
    return Promise.resolve();
  }
  pushRedirect(path: string, params?: URLSearchParams, replaceHistory?: boolean) {
    // no-op
    // istanbul ignore next
    return Promise.resolve();
  }
  putFlash(key: string, value: string) {
    // no-op
    // istanbul ignore next
    return Promise.resolve();
  }
  sendInfo(info: Info<TInfo>) {
    // no-op
  }
  subscribe(topic: string) {
    // no-op
    // istanbul ignore next
    return Promise.resolve();
  }
  allowUpload(name: string, options?: UploadConfigOptions): Promise<void> {
    // no-op
    // istanbul ignore next
    return Promise.resolve();
  }
  cancelUpload(configName: string, ref: string): Promise<void> {
    // no-op
    // istanbul ignore next
    return Promise.resolve();
  }
  consumeUploadedEntries<T>(
    configName: string,
    fn: (meta: ConsumeUploadedEntriesMeta, entry: UploadEntry) => Promise<T>
  ): Promise<T[]> {
    // no-op
    // istanbul ignore next
    return Promise.resolve([]);
  }
  uploadedEntries(configName: string): Promise<{ completed: UploadEntry[]; inProgress: UploadEntry[] }> {
    // no-op
    // istanbul ignore next
    return Promise.resolve({ completed: [], inProgress: [] });
  }

  updateContextWithTempAssigns() {
    if (Object.keys(this._tempContext).length > 0) {
      this.assign(this._tempContext);
    }
  }
}

/**
 * Used to render Http requests for `LiveView`s.  Only support setting the context via
 * `assign` and reading the context via `context`.
 */
export class HttpLiveViewSocket<
  TContext extends LiveContext = AnyLiveContext,
  TInfo extends LiveInfo = AnyLiveInfo
> extends BaseLiveViewSocket<TContext, TInfo> {
  readonly id: string;
  readonly connected: boolean = false;
  readonly uploadConfigs: { [name: string]: UploadConfig } = {};
  readonly url: URL;

  private _redirect: { to: string; replace: boolean } | undefined;
  constructor(id: string, url: URL) {
    super();
    this.id = id;
    this.url = url;
  }

  get redirect(): { to: string; replace: boolean } | undefined {
    return this._redirect;
  }

  pushRedirect(path: string, params?: URLSearchParams, replaceHistory?: boolean) {
    const to = params ? `${path}?${params}` : path;
    this._redirect = {
      to,
      replace: replaceHistory || false,
    };
    return Promise.resolve();
  }

  allowUpload(name: string, options?: UploadConfigOptions | undefined): Promise<void> {
    this.uploadConfigs[name] = new UploadConfig(name, options);
    return Promise.resolve();
  }
}

/**
 * Full inmplementation used once a `LiveView` is mounted to a websocket.
 * In practice, this uses callbacks defined in the LiveViewManager that
 * capture state and manipulate it in the context of that LiveViewManager instance.
 */
export class WsLiveViewSocket<
  TContext extends LiveContext = AnyLiveContext,
  TInfo extends LiveInfo = AnyLiveInfo
> extends BaseLiveViewSocket<TContext, TInfo> {
  readonly id: string;
  readonly connected: boolean = true;
  readonly url: URL;

  // callbacks to the ComponentManager
  private pageTitleCallback: (newPageTitle: string) => void;
  private pushEventCallback: (pushEvent: AnyLivePushEvent) => void;
  private pushPatchCallback: (path: string, params?: URLSearchParams, replaceHistory?: boolean) => void;
  private pushRedirectCallback: (path: string, params?: URLSearchParams, replaceHistory?: boolean) => void;
  private putFlashCallback: (key: string, value: string) => void;
  private sendInfoCallback: (info: Info<TInfo>) => void;
  private subscribeCallback: (topic: string) => void;
  private allowUploadCallback: (name: string, options?: UploadConfigOptions) => void;
  private cancelUploadCallback: (configName: string, ref: string) => void;
  private consumeUploadedEntriesCallback: <T>(
    configName: string,
    fn: (meta: ConsumeUploadedEntriesMeta, entry: UploadEntry) => Promise<T>
  ) => Promise<T[]>;
  private uploadedEntriesCallback: (
    configName: string
  ) => Promise<{ completed: UploadEntry[]; inProgress: UploadEntry[] }>;

  constructor(
    id: string,
    url: URL,
    pageTitleCallback: (newPageTitle: string) => void,
    pushEventCallback: (pushEvent: AnyLivePushEvent) => void,
    pushPatchCallback: (path: string, params?: URLSearchParams, replaceHistory?: boolean) => void,
    pushRedirectCallback: (path: string, params?: URLSearchParams, replaceHistory?: boolean) => void,
    putFlashCallback: (key: string, value: string) => void,
    sendInfoCallback: (info: Info<TInfo>) => void,
    subscribeCallback: (topic: string) => void,
    allowUploadCallback: (name: string, options?: UploadConfigOptions) => void,
    cancelUploadCallback: (configName: string, ref: string) => void,
    consumeUploadedEntriesCallback: <T>(
      configName: string,
      fn: (meta: ConsumeUploadedEntriesMeta, entry: UploadEntry) => Promise<T>
    ) => Promise<T[]>,
    uploadedEntriesCallback: (configName: string) => Promise<{ completed: UploadEntry[]; inProgress: UploadEntry[] }>
  ) {
    super();
    this.id = id;
    this.url = url;
    this.pageTitleCallback = pageTitleCallback;
    this.pushEventCallback = pushEventCallback;
    this.pushPatchCallback = pushPatchCallback;
    this.pushRedirectCallback = pushRedirectCallback;
    this.putFlashCallback = putFlashCallback;
    this.sendInfoCallback = sendInfoCallback;
    this.subscribeCallback = subscribeCallback;
    this.allowUploadCallback = allowUploadCallback;
    this.cancelUploadCallback = cancelUploadCallback;
    this.consumeUploadedEntriesCallback = consumeUploadedEntriesCallback;
    this.uploadedEntriesCallback = uploadedEntriesCallback;
  }
  async putFlash(key: string, value: string) {
    await this.putFlashCallback(key, value);
  }
  pageTitle(newPageTitle: string) {
    this.pageTitleCallback(newPageTitle);
  }
  pushEvent(pushEvent: AnyLivePushEvent) {
    this.pushEventCallback(pushEvent);
  }
  async pushPatch(path: string, params?: URLSearchParams, replaceHistory: boolean = false) {
    await this.pushPatchCallback(path, params, replaceHistory);
  }
  async pushRedirect(path: string, params?: URLSearchParams, replaceHistory: boolean = false) {
    await this.pushRedirectCallback(path, params, replaceHistory);
  }
  sendInfo(info: Info<TInfo>): void {
    this.sendInfoCallback(info);
  }
  async subscribe(topic: string) {
    await this.subscribeCallback(topic);
  }
  async allowUpload(name: string, options?: UploadConfigOptions | undefined): Promise<void> {
    await this.allowUploadCallback(name, options);
  }
  async cancelUpload(configName: string, ref: string): Promise<void> {
    await this.cancelUploadCallback(configName, ref);
  }
  async consumeUploadedEntries<T>(
    configName: string,
    fn: (meta: ConsumeUploadedEntriesMeta, entry: UploadEntry) => Promise<T>
  ): Promise<T[]> {
    return await this.consumeUploadedEntriesCallback<T>(configName, fn);
  }
  async uploadedEntries(configName: string): Promise<{ completed: UploadEntry[]; inProgress: UploadEntry[] }> {
    return await this.uploadedEntriesCallback(configName);
  }
}
