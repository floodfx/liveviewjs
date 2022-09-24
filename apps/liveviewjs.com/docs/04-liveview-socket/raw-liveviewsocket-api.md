---
sidebar_position: 7
---

# Raw `LiveViewSocket` API

For your reference, below is the raw Typescript for the `LiveViewSocket` interface (copied from
[here](https://github.com/floodfx/liveviewjs/blob/main/packages/core/src/server/socket/liveSocket.ts)):

```ts title="packages/core/src/server/socket/liveSocket.ts"
/**
 * Main interface to update state, interact, message, and otherwise
 * manage the lifecycle of a `LiveView`.
 *
 * The `LiveView` API (i.e.,  `mount`, `handleParams`, `handleInfo`, `handleEvent`)
 * are all passed `LiveViewSocket` which provide access to the current `LiveView`
 * context (via `context`) as well as various methods update the `LiveView` including
 * `assign` which updates the `LiveView`'s context (i.e.,  state).
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
   * The current context (i.e.,  state) of the `LiveView`
   */
  readonly context: TContext;
  /**
   * `assign` is used to update the context (i.e.,  state) of the `LiveComponent`
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
   * Pushes an event from the server to the client.  Requires a
   * client `Hook` to be defined and to be listening for the event
   * via `this.handleEvent` callback.
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
   * without reloading the whole page (i.e.,  making a full HTTP request).  Can be
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
   * Runs the given function on the given interval until this `LiveView` is
   * unloaded.
   *
   * @param fn the function to run on the interval
   * @param intervalMillis the interval to run the function on in milliseconds
   */
  repeat(fn: () => void, intervalMillis: number): void;
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
   * @throws if any of the entries are not fully uploaded (i.e.,  completed)
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
```
