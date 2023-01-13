/// <reference types="node" />
import { MatchResult } from 'path-to-regexp';
import { SomeZodObject } from 'zod';

/**
 * Type that defines a function that returns a string value used for protecting requests against
 * Cross-site Request Forgery (CSRF) attacks.  Good concrete implementations are: crypto.randomBytes, uuidv4.
 */
declare type CsrfGenerator = () => string;

/**
 * Abstracts some simple file system operations.  Necessary to support
 * both nodejs and deno since those APIs differ.
 */
interface FileSystemAdaptor {
    /**
     * Get a temporary file path from the OS with the lastPathPart as the file name.
     */
    tempPath: (lastPathPart: string) => string;
    /**
     * Writes the data to the given destination path.
     */
    writeTempFile: (dest: string, data: Buffer) => void;
    /**
     * Creates and/or appends data from src to dest
     */
    createOrAppendFile: (dest: string, src: string) => void;
}

/**
 * Generically represent session with `string` keys to `any` value and a named member called
 * `_csrf_token` that is used to protect against cross-site request forgery attacks.
 */
declare type SessionData = {
    /**
     * The CSRF token used to protect against cross-site request forgery attacks.
     */
    _csrf_token?: string;
    [key: string]: any;
};

/**
 * Adatpor that implements adding flash to the session data and removing flash from the session data.
 */
interface FlashAdaptor {
    peekFlash(session: SessionData, key: string): Promise<string | undefined>;
    popFlash(session: SessionData, key: string): Promise<string | undefined>;
    putFlash(session: SessionData, key: string, value: string): Promise<void>;
    clearFlash(session: SessionData, key: string): Promise<void>;
}

/**
 * Options for creating a new upload config.
 */
declare type UploadConfigOptions = {
    /**
     * "accept" contains the unique file type specifiers that can be uploaded.
     * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers
     * An empty array will allow all file types.
     */
    accept?: string[];
    /**
     * the maximum number of files that can be uploaded at once. Defaults to 1.
     */
    max_entries?: number;
    /**
     * the maximum size of each file in bytes. Defaults to 10MB.
     */
    max_file_size?: number;
    /**
     * Whether to upload the selected files automatically when the user selects them.
     * Defaults to false.
     */
    auto_upload?: boolean;
    /**
     * The size of each chunk in bytes. Defaults to 64kb.
     */
    chunk_size?: number;
};
/**
 * UploadConfig contains configuration and entry related details for uploading files.
 */
interface UploadConfig {
    /**
     * The name of the upload config to be used in the `allowUpload` and `uploadedEntries` methods.
     * should be unique per LiveView.
     */
    name: string;
    /**
     * "accept" contains the unique file type specifiers that can be uploaded.
     * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers
     */
    accept: string[];
    /**
     * the maximum number of files that can be uploaded at once. Defaults to 1.
     */
    max_entries: number;
    /**
     * the maximum size of each file in bytes. Defaults to 10MB.
     */
    max_file_size: number;
    /**
     * Whether to upload the selected files automatically when the user selects them.
     * Defaults to false.
     */
    auto_upload: boolean;
    /**
     * The size of each chunk in bytes. Defaults to 64kb.
     */
    chunk_size: number;
    /**
     * The files selected for upload.
     */
    entries: UploadEntry[];
    /**
     * The unique instance ref of the upload config
     */
    ref: string;
    /**
     * Errors that have occurred during selection or upload.
     */
    errors: string[];
}
/**
 * UploadConfig contains configuration and entry related details for uploading files.
 */
declare class UploadConfig implements UploadConfig {
    constructor(name: string, options?: UploadConfigOptions);
    /**
     * Set the entries for the config.
     * @param entries UploadEntry[] to set
     */
    setEntries(entries: UploadEntry[]): void;
    /**
     * Remove an entry from the config.
     * @param ref The unique ref of the UploadEntry to remove.
     */
    removeEntry(ref: string): void;
    /**
     * Returns all the entries (throws if any are still uploading) and removes
     * the entries from the config.
     */
    consumeEntries(): UploadEntry[];
    /**
     * Checks if the entries are valid w.r.t. max_entries, max_file_size, and mime type.
     */
    private validate;
}

declare type PhxIncomingMessage<Payload> = [
    joinRef: string | null,
    messageRef: string | null,
    topic: "phoenix" | string,
    event: "phx_join" | "event" | "heartbeat" | "live_patch" | "phx_leave" | "allow_upload" | "progress",
    payload: Payload
];
declare type PhxFlash = {
    info?: string;
    error?: string;
};
interface PhxJoinPayload {
    params: LiveViewMountParams;
    session: string;
    static: string;
    url?: string;
    redirect?: string;
    flash?: PhxFlash | null;
}
declare type PhxJoinIncoming = PhxIncomingMessage<PhxJoinPayload>;
declare type PhxHeartbeatIncoming = PhxIncomingMessage<{}>;
declare type PhxLivePatchIncoming = PhxIncomingMessage<{
    url: string;
}>;
declare type AllowUploadEntry = {
    last_modified: number;
    name: string;
    size: number;
    type: string;
    ref: string;
};
declare type PhxAllowUploadIncoming = PhxIncomingMessage<{
    ref: string;
    entries: AllowUploadEntry[];
}>;
declare type PhxJoinUploadIncoming = PhxIncomingMessage<{
    token: string;
}>;
declare type PhxProgressUploadIncoming = PhxIncomingMessage<{
    event: string | null;
    ref: string;
    entry_ref: string;
    progress: number;
}>;
interface PhxEventPayload<TType extends string, TValue, TEvent extends string = string> {
    type: TType;
    event: TEvent;
    value: TValue;
    cid?: number;
}
declare type PhxEventUpload = {
    path: string;
    last_modified: number;
    ref: string;
    name: string;
    type: string;
    size: number;
};
interface PhxEventUploads {
    uploads?: {
        [key: string]: PhxEventUpload[];
    };
}
declare type PhxClickPayload = PhxEventPayload<"click", {
    value: string;
}>;
declare type PhxLVClearFlashPayload = PhxEventPayload<"click", {
    key: string;
}, "lv:clear-flash">;
declare type PhxFormPayload = PhxEventPayload<"form", string> & PhxEventUploads;
declare type PhxKeyUpPayload = PhxEventPayload<"keyup", {
    key: string;
    value?: string;
}>;
declare type PhxKeyDownPayload = PhxEventPayload<"keydown", {
    key: string;
    value?: string;
}>;
declare type PhxFocusPayload = PhxEventPayload<"focus", {
    value: string;
}>;
declare type PhxBlurPayload = PhxEventPayload<"blur", {
    value: string;
}>;
declare type PhxHookPayload = PhxEventPayload<"hook", Record<string, string>>;
declare type PhxMessage = {
    type: "phx_join";
    message: PhxJoinIncoming;
} | {
    type: "heartbeat";
    message: PhxHeartbeatIncoming;
} | {
    type: "event";
    message: PhxIncomingMessage<PhxClickPayload | PhxFormPayload | PhxKeyDownPayload | PhxKeyUpPayload | PhxFocusPayload | PhxBlurPayload | PhxHookPayload>;
} | {
    type: "live_patch";
    message: PhxLivePatchIncoming;
} | {
    type: "phx_leave";
    message: PhxIncomingMessage<{}>;
} | {
    type: "allow_upload";
    message: PhxAllowUploadIncoming;
} | {
    type: "phx_join_upload";
    message: PhxJoinUploadIncoming;
} | {
    type: "upload_binary";
    message: {
        data: Buffer;
    };
} | {
    type: "progress";
    message: PhxProgressUploadIncoming;
};

/**
 * UploadEntry represents a file and related metadata selected for upload
 */
interface UploadEntry {
    /**
     * Whether the file selection has been cancelled. Defaults to false.
     */
    cancelled: boolean;
    /**
     * The timestamp when the file was last modified from the client's file system
     */
    last_modified: number;
    /**
     * The name of the file from the client's file system
     */
    name: string;
    /**
     * The size of the file in bytes from the client's file system
     */
    size: number;
    /**
     * The mime type of the file from the client's file system
     */
    type: string;
    /**
     * True if the file has been uploaded. Defaults to false.
     */
    done: boolean;
    /**
     * True if the file has been auto-uploaded. Defaults to false.
     */
    preflighted: boolean;
    /**
     * The integer percentage of the file that has been uploaded. Defaults to 0.
     */
    progress: number;
    /**
     * The unique instance ref of the upload entry
     */
    ref: string;
    /**
     * The unique instance ref of the upload config to which this entry belongs
     */
    upload_ref: string;
    /**
     * A uuid for the file
     */
    uuid: string;
    /**
     * True if there are no errors with the file. Defaults to true.
     */
    valid: boolean;
    /**
     * Errors that have occurred during selection or upload.
     */
    errors: string[];
}
/**
 * UploadEntry represents a file and related metadata selected for upload
 */
declare class UploadEntry {
    #private;
    constructor(upload: PhxEventUpload, config: UploadConfig);
    /**
     * Takes in a progress percentage and updates the entry accordingly
     * @param progress
     */
    updateProgress(progress: number): void;
    /**
     * Validates the file against the upload config
     */
    validate(): void;
    /**
     * Sets the temp file path for the entry, used internally
     * @param tempFilePath a path to the temp file
     */
    setTempFile(tempFilePath: string): void;
    /**
     * Gets the temp file path for the entry, used internally
     * @returns the temp file path
     */
    getTempFile(): string;
}

/**
 *  Type that enables Info events to be passed as plain strings
 */
declare type Info<TInfo extends LiveInfo> = TInfo["type"] | TInfo;
/**
 * The type passed to the `consumeUploadedEntries` callback's "meta" parameter
 */
declare type ConsumeUploadedEntriesMeta = {
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
interface LiveViewSocket<TContext extends LiveContext = AnyLiveContext, TInfos extends LiveInfo = AnyLiveInfo> {
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
    consumeUploadedEntries<T>(configName: string, fn: (meta: ConsumeUploadedEntriesMeta, entry: UploadEntry) => Promise<T>): Promise<T[]>;
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
declare abstract class BaseLiveViewSocket<TContext extends LiveContext = AnyLiveContext, TInfo extends LiveInfo = AnyLiveInfo> implements LiveViewSocket<TContext, TInfo> {
    abstract url: URL;
    abstract connected: boolean;
    abstract id: string;
    private _context;
    private _tempContext;
    get context(): TContext;
    assign(context: Partial<TContext>): void;
    tempAssign(tempContext: Partial<TContext>): void;
    pageTitle(newPageTitle: string): void;
    pushEvent(pushEvent: AnyLivePushEvent): void;
    pushPatch(path: string, params?: URLSearchParams, replaceHistory?: boolean): Promise<void>;
    pushRedirect(path: string, params?: URLSearchParams, replaceHistory?: boolean): Promise<void>;
    putFlash(key: string, value: string): Promise<void>;
    sendInfo(info: Info<TInfo>): void;
    subscribe(topic: string): Promise<void>;
    allowUpload(name: string, options?: UploadConfigOptions): Promise<void>;
    cancelUpload(configName: string, ref: string): Promise<void>;
    consumeUploadedEntries<T>(configName: string, fn: (meta: ConsumeUploadedEntriesMeta, entry: UploadEntry) => Promise<T>): Promise<T[]>;
    uploadedEntries(configName: string): Promise<{
        completed: UploadEntry[];
        inProgress: UploadEntry[];
    }>;
    updateContextWithTempAssigns(): void;
}
/**
 * Used to render Http requests for `LiveView`s.  Only support setting the context via
 * `assign` and reading the context via `context`.
 */
declare class HttpLiveViewSocket<TContext extends LiveContext = AnyLiveContext, TInfo extends LiveInfo = AnyLiveInfo> extends BaseLiveViewSocket<TContext, TInfo> {
    readonly id: string;
    readonly connected: boolean;
    readonly uploadConfigs: {
        [name: string]: UploadConfig;
    };
    readonly url: URL;
    private _redirect;
    constructor(id: string, url: URL);
    get redirect(): {
        to: string;
        replace: boolean;
    } | undefined;
    pushRedirect(path: string, params?: URLSearchParams, replaceHistory?: boolean): Promise<void>;
    allowUpload(name: string, options?: UploadConfigOptions | undefined): Promise<void>;
}
/**
 * Full inmplementation used once a `LiveView` is mounted to a websocket.
 * In practice, this uses callbacks defined in the LiveViewManager that
 * capture state and manipulate it in the context of that LiveViewManager instance.
 */
declare class WsLiveViewSocket<TContext extends LiveContext = AnyLiveContext, TInfo extends LiveInfo = AnyLiveInfo> extends BaseLiveViewSocket<TContext, TInfo> {
    readonly id: string;
    readonly connected: boolean;
    readonly url: URL;
    private pageTitleCallback;
    private pushEventCallback;
    private pushPatchCallback;
    private pushRedirectCallback;
    private putFlashCallback;
    private sendInfoCallback;
    private subscribeCallback;
    private allowUploadCallback;
    private cancelUploadCallback;
    private consumeUploadedEntriesCallback;
    private uploadedEntriesCallback;
    constructor(id: string, url: URL, pageTitleCallback: (newPageTitle: string) => void, pushEventCallback: (pushEvent: AnyLivePushEvent) => void, pushPatchCallback: (path: string, params?: URLSearchParams, replaceHistory?: boolean) => void, pushRedirectCallback: (path: string, params?: URLSearchParams, replaceHistory?: boolean) => void, putFlashCallback: (key: string, value: string) => void, sendInfoCallback: (info: Info<TInfo>) => void, subscribeCallback: (topic: string) => void, allowUploadCallback: (name: string, options?: UploadConfigOptions) => void, cancelUploadCallback: (configName: string, ref: string) => void, consumeUploadedEntriesCallback: <T>(configName: string, fn: (meta: ConsumeUploadedEntriesMeta, entry: UploadEntry) => Promise<T>) => Promise<T[]>, uploadedEntriesCallback: (configName: string) => Promise<{
        completed: UploadEntry[];
        inProgress: UploadEntry[];
    }>);
    putFlash(key: string, value: string): Promise<void>;
    pageTitle(newPageTitle: string): void;
    pushEvent(pushEvent: AnyLivePushEvent): void;
    pushPatch(path: string, params?: URLSearchParams, replaceHistory?: boolean): Promise<void>;
    pushRedirect(path: string, params?: URLSearchParams, replaceHistory?: boolean): Promise<void>;
    sendInfo(info: Info<TInfo>): void;
    subscribe(topic: string): Promise<void>;
    allowUpload(name: string, options?: UploadConfigOptions | undefined): Promise<void>;
    cancelUpload(configName: string, ref: string): Promise<void>;
    consumeUploadedEntries<T>(configName: string, fn: (meta: ConsumeUploadedEntriesMeta, entry: UploadEntry) => Promise<T>): Promise<T[]>;
    uploadedEntries(configName: string): Promise<{
        completed: UploadEntry[];
        inProgress: UploadEntry[];
    }>;
}

declare type WsMsgListener = (data: Buffer, isBinary: boolean) => void;
declare type WsCloseListener = () => void;
/**
 * Adaptor that enables sending websocket messages over a concrete websocket implementation.
 */
interface WsAdaptor {
    send(message: string, errorHandler?: (err: any) => void): void;
    subscribeToMessages(msgListener: WsMsgListener): Promise<void> | void;
    subscribeToClose(closeListener: WsCloseListener): Promise<void> | void;
}

declare type SubscriberFunction<T> = (data: T) => void;
declare type SubscriberId = string;
/**
 * A Subscriber allows you to subscribe and unsubscribe to a PubSub topic providing a callback function.
 */
interface Subscriber {
    subscribe<T extends {
        type: string;
    }>(topic: string, subscriber: SubscriberFunction<T>): Promise<SubscriberId>;
    unsubscribe(topic: string, subscriberId: SubscriberId): Promise<void>;
}
/**
 * A Publisher allows you to publish data to a PubSub topic.
 */
interface Publisher {
    broadcast<T extends {
        type: string;
    }>(topic: string, data: T): Promise<void>;
}
/**
 * A PubSub implements both a Publisher and a Subscriber.
 */
interface PubSub extends Subscriber, Publisher {
}

declare class SingleProcessPubSub implements Subscriber, Publisher {
    private subscribers;
    subscribe<T>(topic: string, subscriber: SubscriberFunction<T>): Promise<string>;
    broadcast<T>(topic: string, data: T): Promise<void>;
    unsubscribe(topic: string, subscriberId: string): Promise<void>;
}

/**
 * The `LiveViewComponentManager` is responsible for managing the lifecycle of a `LiveViewComponent`
 * including routing of events, the state (i.e. context), and other aspects of the component.  The
 * `MessageRouter` is responsible for routing messages to the appropriate `LiveViewComponentManager`
 * based on the topic on the incoming socket messages.
 */
declare class LiveViewManager {
    private connectionId;
    private joinId;
    private url;
    private wsAdaptor;
    private subscriptionIds;
    private liveView;
    private intervals;
    private session;
    private pubSub;
    private serDe;
    private flashAdaptor;
    private fileSystemAdaptor;
    private uploadConfigs;
    private activeUploadRef;
    private csrfToken?;
    private pathParams;
    private _infoQueue;
    private _events;
    private _pageTitle;
    private pageTitleChanged;
    private socket;
    private liveViewRootTemplate?;
    private hasWarnedAboutMissingCsrfToken;
    private _parts;
    private _cidIndex;
    constructor(liveView: LiveView, connectionId: string, wsAdaptor: WsAdaptor, serDe: SerDe, pubSub: PubSub, flashAdaptor: FlashAdaptor, fileAdapter: FileSystemAdaptor, pathParams: PathParams, liveViewRootTemplate?: LiveViewWrapperTemplate);
    /**
     * The `phx_join` event is the initial connection between the client and the server and initializes the
     * `LiveView`, sets up subscriptions for additional events, and otherwise prepares the `LiveView` for
     * future client interactions.
     * @param message a `PhxJoinIncoming` message
     */
    handleJoin(message: PhxJoinIncoming): Promise<void>;
    /**
     * Every event other than `phx_join` that is received over the connected WebSocket are passed into this
     * method and then dispatched the appropriate handler based on the message type.
     * @param phxMessage
     */
    handleSubscriptions(phxMessage: PhxMessage): Promise<void>;
    /**
     * Any message of type `event` is passed into this method and then handled based on the payload details of
     * the message including: click, form, key, blur/focus, and hook events.
     * @param message a `PhxEventIncoming` message with a different payload depending on the event type
     */
    onEvent(message: PhxIncomingMessage<PhxClickPayload | PhxFormPayload | PhxKeyUpPayload | PhxKeyDownPayload | PhxBlurPayload | PhxFocusPayload | PhxHookPayload | PhxLVClearFlashPayload>): Promise<void>;
    onAllowUpload(message: PhxAllowUploadIncoming): Promise<void>;
    onPhxJoinUpload(message: PhxJoinUploadIncoming): Promise<void>;
    onUploadBinary(message: {
        data: Buffer;
    }): Promise<void>;
    onProgressUpload(message: PhxProgressUploadIncoming): Promise<void>;
    /**
     * Handle's `live_patch` message from clients which denote change to the `LiveView`'s path parameters
     * and kicks off a re-render after calling `handleParams`.
     * @param message a `PhxLivePatchIncoming` message
     */
    onLivePatch(message: PhxLivePatchIncoming): Promise<void>;
    /**
     * Responds to `heartbeat` message from clients by sending a `heartbeat` message back.
     * @param message
     */
    onHeartbeat(message: PhxHeartbeatIncoming): void;
    /**
     * Handles `phx_leave` messages from clients which are sent when the client is leaves the `LiveView`
     * that is currently being rendered by navigating to a different `LiveView` or closing the browser.
     * @param message
     */
    onPhxLeave(message: PhxIncomingMessage<{}>): Promise<void>;
    /**
     * Clean up any resources used by the `LiveView` and `LiveComponent` instances.
     */
    private shutdown;
    /**
     * Callback from `LiveSocket`s passed into `LiveView` and `LiveComponent` lifecycle methods (i.e. mount, handleParams,
     * handleEvent, handleInfo, update, etc) that enables a `LiveView` or `LiveComponent` to update the browser's
     * path and query string params.
     * @param path the path to patch
     * @param params the URLSearchParams to that will drive the new path query string params
     * @param replaceHistory whether to replace the current browser history entry or not
     */
    private onPushPatch;
    /**
     * Callback from `LiveSocket`s passed into `LiveView` and `LiveComponent` lifecycle methods (i.e. mount, handleParams,
     * handleEvent, handleInfo, update, etc) that enables a `LiveView` or `LiveComponent` to redirect the browser to a
     * new path and query string params.
     * @param path the path to redirect to
     * @param params the URLSearchParams to that will be added to the redirect
     * @param replaceHistory whether to replace the current browser history entry or not
     */
    private onPushRedirect;
    /**
     * Common logic that handles both `live_patch` and `live_redirect` messages from clients.
     * @param navEvent the type of navigation event to handle: either `live_patch` or `live_redirect`
     * @param path the path to patch or to be redirected to
     * @param params the URLSearchParams to that will be added to the path
     * @param replaceHistory whether to replace the current browser history entry or not
     */
    private onPushNavigation;
    /**
     * Queues `AnyLivePushEvent` messages to be sent to the client on the subsequent `sendPhxReply` call.
     * @param pushEvent the `AnyLivePushEvent` to queue
     */
    private onPushEvent;
    /**
     * Queues `AnyLiveInfo` messages to be sent to the LiveView until after the current lifecycle
     * @param info the AnyLiveInfo to queue
     */
    private onSendInfo;
    /**
     * Handles sending `LiveInfo` events back to the `LiveView`'s `handleInfo` method.
     * @param info the `LiveInfo` event to dispatch to the `LiveView`
     */
    private sendInternal;
    private set pageTitle(value);
    private putFlash;
    private clearFlash;
    private maybeSendInfos;
    private maybeWrapInRootTemplate;
    private maybeAddPageTitleToParts;
    private maybeAddEventsToParts;
    private sendPhxReply;
    /**
     * Records for stateful components where key is a compound id `${componentName}_${componentId}`
     * and value is a tuple of [context, renderedPartsTree, changed, myself].
     *
     */
    private statefulLiveComponents;
    private statefuleLiveComponentInstances;
    /**
     * Collect all the LiveComponents first, group by their component type (e.g. instanceof),
     * then run single preload for all components of same type. then run rest of lifecycle
     * based on stateless or stateful.
     * @param liveComponent
     * @param params
     */
    private liveComponentProcessor;
    private maybeAddLiveComponentsToParts;
    defaultLiveViewMeta(): LiveViewMeta;
    private newLiveViewSocket;
    private newLiveComponentSocket;
}

/**
 * Phx is a namespace for Phoenix LiveView protocol related types and functions.
 */
declare namespace Phx {
    /**
     * MsgIdx is an enum of the indexes of the Phx LiveView message tuple.
     */
    enum MsgIdx {
        joinRef = 0,
        msgRef = 1,
        topic = 2,
        event = 3,
        payload = 4
    }
    /**
     * Msg are the messages typically send from the client to the server.
     * The payload type varies based on the message type and,
     * in some cases, the joinRef and/or msgRef may be null.
     */
    type Msg<Payload = unknown> = [
        joinRef: string | null,
        msgRef: string | null,
        topic: string,
        event: string,
        payload: Payload
    ];
    /**
     * EventPayload is the payload for a LiveView event (click, form, blur, key, etc)
     */
    type EventPayload<T extends string = string, V = any, E extends string = string> = {
        type: T;
        event: E;
        value: V;
        cid?: number;
    };
    /**
     * AllowUploadPayload is the payload for the allow_upload event
     * which is initiated during binary file uploads.
     */
    type AllowUploadPayload = {
        /**
         * ref is a string that is used to identify the upload
         */
        ref: string;
        /**
         * entries is an array of one or more entries to be uploaded
         */
        entries: AllowUploadEntry[];
    };
    /**
     * JoinUploadPayload is the payload for the join_upload event
     * which is initiated at the start of a binary file upload process.
     */
    type JoinUploadPayload = {
        token: string;
    };
    /**
     * ProgressUploadPayload is the payload for the progress_upload event
     * which is send (potentially multiple times, depending on the entry size and chunk size)
     * during a binary file upload process
     */
    type ProgressUploadPayload = {
        event: string | null;
        ref: string;
        entry_ref: string;
        progress: number;
    };
    /**
     * LivePatchPayload is the payload for the live_patch event
     * which affect the url of the `LiveView`.
     */
    type LivePatchPayload = {
        url: string;
    };
    /**
     * LiveNavPushPayload is the payload for the live_nav_push events
     * either live_patch or live_redirect, both of which will change
     * the url of the `LiveView`.
     */
    interface LiveNavPushPayload {
        kind: "push" | "replace";
        to: string;
    }
    /**
     * UploadMsg is the initial type that we deserialize the binary upload message into.
     * It is then converted into a Msg<Buffer> which is the type that is used throughout
     * the rest of the code.
     */
    type UploadMsg = {
        joinRef: string;
        msgRef: string;
        topic: string;
        event: string;
        payload: Buffer;
    };
    /**
     * parse attempts to parse a string into a Msg.
     * @param msg the string to parse
     * @returns the parsed Msg
     * @throws an error if the message is invalid
     */
    function parse(msg: string): Msg;
    /**
     * parseBinary attempts to parse a binary buffer into a Msg<Buffer>.
     * @param raw the binary buffer to parse
     * @returns a Msg<Buffer>
     */
    function parseBinary(raw: Buffer): Phx.Msg<Buffer>;
    /**
     * serialize serializes a Msg into a string typically for sending across the socket back to the client.
     * @param msg the Msg to serialize
     * @returns the serialized Msg
     */
    function serialize(msg: Msg): string;
}

declare type AllowUploadEntries = {
    [key: string]: string;
};

declare function deepDiff(oldParts: Parts, newParts: Parts): Parts;
declare function diffArrays(oldArray: unknown[], newArray: unknown[]): boolean;
declare function diffArrays2<T extends Parts | string>(oldArray: T[], newArray: T[]): T[];

declare function join(array: (string | HtmlSafeString)[], separator?: string | HtmlSafeString): HtmlSafeString;
declare function safe(value: unknown): HtmlSafeString;
declare function escapehtml(unsafe: unknown): string;
declare type Parts = {
    [key: string]: unknown;
};
/**
 * HtmlSafeString is what a `LiveView` returns from its `render` function.
 * It is based on "tagged template literals" and is what allows LiveViewJS
 * to minimize the amount of data sent to the client.
 */
declare class HtmlSafeString {
    readonly statics: readonly string[];
    readonly dynamics: readonly unknown[];
    readonly isLiveComponent: boolean;
    constructor(statics: readonly string[], dynamics: readonly unknown[], isLiveComponent?: boolean);
    partsTree(includeStatics?: boolean): Parts;
    toString(): string;
}
declare function html(statics: TemplateStringsArray, ...dynamics: unknown[]): HtmlSafeString;

interface FormForOptions {
    phx_submit?: string;
    phx_change?: string;
    method?: "get" | "post";
    id?: string;
}
declare const form_for: <T>(action: string, csrfToken: string, options?: FormForOptions) => HtmlSafeString;

interface InputOptions {
    placeholder?: string;
    autocomplete?: "off" | "on";
    phx_debounce?: number | "blur" | "focus";
    type?: "text" | "tel";
    className?: string;
}
declare const text_input: <T>(changeset: LiveViewChangeset<T>, key: keyof T, options?: InputOptions) => HtmlSafeString;
interface TelephoneInputOptions extends Omit<InputOptions, "type"> {
}
declare const telephone_input: <T>(changeset: LiveViewChangeset<T>, key: keyof T, options?: TelephoneInputOptions) => HtmlSafeString;
interface ErrorTagOptions {
    className?: string;
}
declare const error_tag: <T>(changeset: LiveViewChangeset<T>, key: keyof T, options?: ErrorTagOptions) => HtmlSafeString;

/**
 * Creates the html for a file input that can be used to upload files to the server.
 * @param uploadConfig the upload config to use for the file input
 * @returns the html for the file input
 */
declare function live_file_input(uploadConfig: UploadConfig): HtmlSafeString;

declare function live_img_preview(entry: UploadEntry): HtmlSafeString;

interface LiveViewPatchHelperOptions {
    to: {
        path: string;
        params?: Record<string, string>;
    };
    className?: string;
}
declare const live_patch: (anchorBody: HtmlSafeString | string, options: LiveViewPatchHelperOptions) => HtmlSafeString;

interface LiveTitleOptions {
    prefix?: string;
    suffix?: string;
    title: string;
}

interface LiveTitleTagOptions {
    prefix?: string;
    suffix?: string;
}
declare const live_title_tag: (title: string, options?: LiveTitleTagOptions) => HtmlSafeString;

declare type Options = string[] | Record<string, string>;
declare type Selected = string | string[];
declare const options_for_select: (options: Options, selected?: Selected) => HtmlSafeString;

interface SubmitOptions {
    phx_disable_with?: string;
    disabled?: boolean;
    [key: string]: string | number | boolean | undefined;
}
declare const submit: (label: string, options?: SubmitOptions) => HtmlSafeString;

/**
 * The string of classes to apply, or
 * a 3-tuple containing the transition class, the class to apply to start
 * the transition, and the class to apply to end the transition.
 * e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]
 */
declare type Transition = string | [string, string, string];
/**
 * Options for the "add_class" and "remove_class" commands
 */
declare type ClassOptions = {
    /**
     * The optional DOM selector element to add or remove the class from (defaults to current element).
     */
    to?: string;
    /**
     * The time over which to apply the transition options.
     */
    time?: number;
    /**
     * The string of classes to apply before adding or removing the classes, or
     * a 3-tuple containing the transition class, the class to apply to start
     * the transition, and the class to apply to end the transition.
     * e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]
     */
    transition?: Transition;
};
/**
 * Options for the "show" command
 */
declare type ShowOptions = {
    /**
     * The optional DOM selector element to show (defaults to current element).
     */
    to?: string;
    /**
     * The time over which to apply the transition options.
     */
    time?: number;
    /**
     * The string of classes to apply before showing, or
     * a 3-tuple containing the transition class, the class to apply to start
     * the transition, and the class to apply to end the transition.
     * e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]
     */
    transition?: Transition;
    /**
     * The optional display value to set when showing the element. Defaults to "block".
     */
    display?: string;
};
declare type HideOptions = {
    /**
     * The optional DOM selector element to hide (defaults to current element).
     */
    to?: string;
    /**
     * The time over which to apply the transition options.
     */
    time?: number;
    /**
     * The string of classes to apply before hiding, or
     * a 3-tuple containing the transition class, the class to apply to start
     * the transition, and the class to apply to end the transition.
     * e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]
     */
    transition?: Transition;
};
/**
 * Options for the "toggle" command
 */
declare type ToggleOptions = {
    /**
     * The optional DOM selector element to toggle (defaults to current element).
     */
    to?: string;
    /**
     * The time over which to apply the transition options.
     */
    time?: number;
    /**
     * The string of classes to apply when toggling in, or
     * a 3-tuple containing the transition class, the class to apply to start
     * the transition, and the class to apply to end the transition.
     * e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]
     */
    in?: Transition;
    /**
     * The string of classes to apply when toggling out, or
     * a 3-tuple containing the transition class, the class to apply to start
     * the transition, and the class to apply to end the transition.
     * e.g. ["ease-out duration-300", "opacity-100", "opacity-0"]
     */
    out?: Transition;
    /**
     * The optional display value to set when toggling in the element. Defaults to "block".
     */
    display?: string;
};
/**
 * Options for the "set_attribute" and "remove_attribute" commands
 */
declare type AttributeOptions = {
    /**
     * The optional DOM selector element to set or remove the attribute from (defaults to current element).
     */
    to?: string;
};
/**
 * Options for the "transition" command
 */
declare type TransitionOptions = {
    /**
     * The optional DOM selector element to apply the transition to (defaults to current element).
     */
    to?: string;
    /**
     * The time over which to apply the transition.
     */
    time?: number;
};
/**
 * Options for the "dispatch" command
 */
declare type DispatchOptions = {
    /**
     * The optional DOM selector element to apply the dispatch to (defaults to current element).
     */
    to?: string;
    /**
     * The optional map to use as the dispatched event's detail.
     */
    detail?: {
        [key: string]: string | number | boolean;
    };
    /**
     * The optional boolean that determines if the event bubbles (defaults to true).
     */
    bubbles?: boolean;
};
/**
 * Options for the "push" command
 */
declare type PushOptions = {
    /**
     * The selector or component ID to push to
     */
    target?: string;
    /**
     * The selector to apply the phx loading classes to
     */
    loading?: string;
    /**
     * An optional boolean indicating whether to trigger the "phx:page-loading-start"
     * and "phx:page-loading-stop" events. Defaults to `false`
     */
    page_loading?: boolean;
    /**
     * An optional map of key/value pairs to include in the event's `value` property
     */
    value?: {
        [key: string]: string | number | boolean;
    };
};
/**
 * The JS Commands API allows you to perform a small set of powerful
 *  DOM operations that only execute on the client.  This allows you
 * apply css classes, show/hide elements, and dispatch events all without
 * making a roundtrip to the server.  These commands are chainable - e.g.
 * JS.add_class(...).show(...).dispatch(...).
 *
 * This is a port of the Phoenix LiveView JS Commands API.
 * https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.JS.html
 */
declare class JS {
    private cmds;
    /**
     * Adds the css class(es) to the target element
     * @param names the css class(es) to add (space delimited)
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    add_class(names: string, options?: ClassOptions): this;
    /**
     * Removes the css class(es) from the target element
     * @param names the css class(es) to remove (space delimited)
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    remove_class(names: string, options?: ClassOptions): this;
    /**
     * Shows the target element
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    show(options?: ShowOptions): this;
    /**
     * Hides the target element
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    hide(options?: HideOptions): this;
    /**
     * Toggles the visibility of the target element
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    toggle(options?: ToggleOptions): this;
    /**
     * Sets the given attribute on the target element
     * @param attr the 2-tuple of the attribute name and value to set
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    set_attribute(attr: [string, string], options?: AttributeOptions): this;
    /**
     * Removes the given attribute from the target element
     * @param attr the attribute name to remove
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    remove_attribute(attr: string, options?: AttributeOptions): this;
    /**
     * Applies the given transition to the target element
     * @param transition the transition to apply
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    transition(transition: Transition, options?: TransitionOptions): this;
    /**
     * Dispatches an event from the target element to the DOM.
     *
     * Note: All events dispatched are of a type CustomEvent, with the exception of "click".
     * For a "click", a MouseEvent is dispatched to properly simulate a UI click.
     *
     * For emitted CustomEvent's, the event detail will contain a dispatcher, which references
     * the DOM node that dispatched the JS event to the target element.
     *
     * @param event the event to dispatch
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    dispatch(event: string, options?: DispatchOptions): this;
    /**
     * Pushes the given event to the server
     * @param event the event to push
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    push(event: string, options?: PushOptions): this;
    /**
     * @returns JSON stringified commands for embedding in HTML
     */
    toString(): string;
}

/**
 * PhxReply is a namespace for Phx protocol related types and functions typically send from the server to the client.
 */
declare namespace PhxReply {
    /**
     * Reply are the messages typically send from the server to the client.
     */
    type Reply = [
        joinRef: string | null,
        msgRef: string | null,
        topic: string,
        event: "phx_reply" | "diff" | "live_redirect" | "live_patch",
        payload: {
            status?: Status;
            response?: Response;
        } | Parts | Phx.LiveNavPushPayload
    ];
    /**
     * Response contains different properties depending on the reply type.
     */
    type Response = {
        rendered?: {
            [key: string]: unknown;
        };
        diff?: {
            [key: string]: unknown;
        };
        config?: UploadConfigOptions;
        entries?: {
            [key: string]: unknown;
        };
    };
    /**
     * Status is the status of the reply.
     */
    type Status = "ok";
    /**
     * renderedReply builds a reply that contains the full rendered HTML for a LiveView.
     * @param msg the original, incoming message (used to get the joinRef, msgRef, and topic)
     * @param parts the "tree" of parts that will be used to render the client-side LiveView
     * @returns the reply message
     */
    function renderedReply(msg: Phx.Msg, parts: Parts): Reply;
    /**
     * diff builds a diff message which only contains the parts of the LiveView that have changed.
     * As opposed to "diffReply" messages, "diff" messages are sent without an original, incoming message but rather because of
     * a "server-side" event that triggers a change in the `LiveView`
     * @param joinRef optional joinRef
     * @param topic the topic (typically the LiveView's socket id)
     * @param diff the "diffed" parts of the LiveView that have changed
     * @returns a diff message
     */
    function diff(joinRef: string | null, topic: string, diff: Parts): Reply;
    /**
     * diffReply builds a diff reply message which only contains the parts of the LiveView that have changed.
     * As opposed to "diff" messages, "diffReply" messages are sent in response to an incoming message from the client.
     * @param msg the original, incoming message (used to get the joinRef, msgRef, and topic)
     * @param diff the "diffed" parts of the LiveView that have changed
     * @returns a diff reply message
     */
    function diffReply(msg: Phx.Msg, diff: Parts): Reply;
    /**
     * allowUploadReply builds a reply that contains the upload configuration, the entries to be uploaded,
     * and the "diff" of the LiveView that will be used to render the client-side LiveView.
     * It is part of the file upload messages flow.
     * @param msg the original, incoming message (used to get the joinRef, msgRef, and topic)
     * @param diff the "tree" of parts that will be used to render the client-side LiveView
     * @param config the upload configuration
     * @param entries the entries to be uploaded
     * @returns the reply message
     */
    function allowUploadReply(msg: Phx.Msg, diff: Parts, config: UploadConfigOptions, entries: AllowUploadEntries): Reply;
    /**
     * heartbeat builds a heartbeat reply message which is used to respond to a heartbeat message from the client.
     * @param msg the original, incoming message (used to get the joinRef, msgRef, and topic)
     * @returns a heartbeat reply message
     */
    function heartbeat(msg: Phx.Msg): Reply;
    /**
     * serialize serializes a reply message to a string.
     * @param msg the message to serialize
     * @returns a string representation of the message
     */
    function serialize(msg: Reply): string;
}

interface WsHandlerConfig {
    serDe: SerDe;
    router: LiveViewRouter;
    fileSysAdaptor: FileSystemAdaptor;
    wrapperTemplate?: LiveViewWrapperTemplate;
    flashAdaptor: FlashAdaptor;
    pubSub: PubSub;
    onError?: (err: any) => void;
    debug?(msg: string): void;
}
declare class WsHandlerContext {
    #private;
    url: URL;
    pushEvents: AnyLivePushEvent[];
    activeUploadRef: string | null;
    uploadConfigs: {
        [key: string]: UploadConfig;
    };
    parts: Parts;
    constructor(liveView: LiveView, socket: WsLiveViewSocket, joinId: string, csrfToken: string, url: URL, sessionData: SessionData, flash: FlashAdaptor);
    get liveView(): LiveView<AnyLiveContext, AnyLiveEvent, AnyLiveInfo>;
    get socket(): WsLiveViewSocket<AnyLiveContext, AnyLiveInfo>;
    get joinId(): string;
    get csrfToken(): string;
    set pageTitle(newTitle: string);
    get hasPageTitleChanged(): boolean;
    get pageTitle(): string;
    get sessionData(): SessionData;
    defaultLiveViewMeta(): LiveViewMeta;
    clearFlash(key: string): Promise<void>;
}
declare class WsHandler {
    #private;
    constructor(ws: WsAdaptor, config: WsHandlerConfig);
    handleMsg(msg: Phx.Msg<unknown>): Promise<void>;
    close(): Promise<void>;
    send(reply: PhxReply.Reply): void;
    private maybeHandleError;
    private cleanupPostReply;
    private viewToDiff;
    private viewToRendered;
    private maybeAddEventsToParts;
    private maybeAddTitleToView;
    private maybeWrapView;
    private newLiveViewMeta;
    private pushNav;
    private newLiveViewSocket;
}

/**
 * LiveViewJS Router for web socket messages.  Determines if a message is a `LiveView` message and routes it
 * to the correct LiveView based on the meta data.
 */
declare class WsMessageRouter {
    private router;
    private pubSub;
    private flashAdaptor;
    private serDe;
    private fileSystemAdaptor;
    private liveViewRootTemplate?;
    constructor(router: LiveViewRouter, pubSub: PubSub, flashAdaptor: FlashAdaptor, serDe: SerDe, filesAdapter: FileSystemAdaptor, liveViewRootTemplate?: LiveViewWrapperTemplate);
    /**
     * Handles incoming websocket messages including binary and text messages and manages
     * routing those messages to the correct LiveViewManager.
     * @param connectionId the connection id of the websocket connection
     * @param data text or binary message data
     * @param wsAdaptor an instance of the websocket adaptor used to send messages to the client
     * @param isBinary whether the message is a binary message
     */
    onMessage(connectionId: string, data: string | unknown, wsAdaptor: WsAdaptor, isBinary?: boolean): Promise<void>;
    onClose(connectionId: string): Promise<void>;
    private onPhxJoin;
}

/**
 * LiveContext sets the minimum requirements for a `LiveView` context.
 */
interface LiveContext {
    [key: string]: any;
}
/**
 * Generic LiveContext Type that can be used for any `LiveView` context.
 */
interface AnyLiveContext extends LiveContext {
    [key: string]: any;
}
/**
 * LiveEvent is the minimal interface for a `LiveEvent` which requires a `type` field.
 */
interface LiveEvent {
    type: string;
}
/**
 * Generic LiveEvent Type that can be used for any `LiveEvent`.
 */
interface AnyLiveEvent extends LiveEvent {
    [key: string]: any;
}
/**
 * LiveInfo is the minimal interface for a `LiveInfo` which requires a `type` field.
 */
interface LiveInfo {
    type: string;
}
/**
 * Generic LiveInfo Type that can be used for any `LiveInfo`.
 */
interface AnyLiveInfo extends LiveInfo {
    [key: string]: any;
}
/**
 * AnyLivePushEvent is the minimal interface for events that can be pushed to the client.
 */
interface AnyLivePushEvent extends LiveEvent {
    [key: string]: any;
}
/**
 * Paramter passed into the `mount` function of a LiveView.
 */
declare type LiveViewMountParams = {
    [key: string]: string | number;
    /**
     * The cross site request forgery token from the `LiveView` html page.
     */
    ["_csrf_token"]: string;
    /**
     * The number of mounts for this `LiveView`.
     */
    ["_mounts"]: number;
};
/**
 * Interface for `LiveView`s supporting the basic lifecycle of a `LiveView`.
 * The `Context` type is for defining the "shape" of the data / state that is
 * managed (updated, changed, etc) by the `LiveView`.
 * The `Params` type is for defining what URLSearchParams may be added to the
 * `LiveView` URL.
 */
interface LiveView<TContext extends LiveContext = AnyLiveContext, TEvents extends LiveEvent = AnyLiveEvent, TInfos extends LiveInfo = AnyLiveInfo> {
    /**
     * `mount` is called both when the `LiveView` is rendered for the HTTP request
     * and upon the first time the `LiveView` is mounted (i.e. connected) via
     * the websocket.  This is where you should load data and set the initial
     * context of the `LiveView`.
     * @param socket the `LiveViewSocket` for this `LiveView`
     * @param session the `SessionData` for this session (i.e. the user)
     * @param params the `LiveViewMountParams` for this `LiveView`
     */
    mount(socket: LiveViewSocket<TContext, TInfos>, session: Partial<SessionData>, params: LiveViewMountParams): void | Promise<void>;
    /**
     * `handleParams` is called on initial loading of the `LiveView` (one-time, after `mount`) as well as on
     * `pushPatch` and `livePatch` events.  This is where you should handle any context (i.e. state)
     * changes that are based on the `LiveView`'s URL parameters.
     * @param params
     * @param url
     * @param socket
     */
    handleParams(url: URL, socket: LiveViewSocket<TContext, TInfos>): void | Promise<void>;
    /**
     * Events initiated by the client (i.e. user interactions with the `LiveView` elements
     * that have the attributes `phx-click`, `phx-change`, `phx-submit`, etc) will be
     * passed into this handler.
     * @param event the (string) event to handle
     * @param socket The `LiveViewSocket` for this `LiveView`
     */
    handleEvent(event: TEvents, socket: LiveViewSocket<TContext, TInfos>): void | Promise<void>;
    /**
     * Internal events, i.e. "Info" initiated by the `LiveView` or `LiveComponent`s that are childern of this
     * `LiveView` are passed into this handler.
     * @param event The info to handle
     * @param socket The `LiveViewSocket` for the `LiveView`
     */
    handleInfo(info: TInfos, socket: LiveViewSocket<TContext, TInfos>): void | Promise<void>;
    /**
     * `render` is where the user interface is generated based on the `LiveView`'s
     * context and meta data.  This is called every lifecycle of the `LiveView`,
     * that is when internal or external events occur.
     * @param context the current state for this `LiveView`
     * @param meta the `LiveViewMeta` for this `LiveView`
     */
    render(context: TContext, meta: LiveViewMeta<TEvents>): LiveViewTemplate | Promise<LiveViewTemplate>;
    /**
     * `shutdown` is called when the `LiveView` is disconnected from the websocket. You can clean
     * up any resources or references here.
     */
    shutdown(id: string, content: TContext): void | Promise<void>;
}
/**
 * Meta data and helpers for `LiveView`s passed into the `render` function of a `LiveView`.
 * Provides readonly access to the `csrfToken`, `url`, and `uploads` for the `LiveView` along
 * with a helper for loading `LiveComponent`s within a `LiveView`.
 */
interface LiveViewMeta<TEvents extends LiveEvent = AnyLiveEvent> {
    /**
     * The cross site request forgery token from the `LiveView` html page which
     * should be used to validate form submissions.
     */
    readonly csrfToken: string;
    /**
     * The current url for this `LiveView`
     */
    readonly url: URL;
    /**
     * A helper for loading `LiveComponent`s within a `LiveView`.
     */
    live_component<TContext extends LiveContext = AnyLiveContext>(liveComponent: LiveComponent<TContext, any, any>, params?: Partial<TContext & {
        id: string | number;
    }>): Promise<LiveViewTemplate>;
    /**
     * Get UploadConfig details about given key
     */
    readonly uploads: {
        [key: string]: UploadConfig;
    };
}
/**
 * Abstract `LiveView` class that is easy to extend for any class-based `LiveView`
 */
declare abstract class BaseLiveView<TContext extends LiveContext = AnyLiveContext, TEvents extends LiveEvent = AnyLiveEvent, TInfos extends LiveInfo = AnyLiveInfo> implements LiveView<TContext, TEvents, TInfos> {
    mount(socket: LiveViewSocket<TContext, TInfos>, session: Partial<SessionData>, params: LiveViewMountParams): void;
    handleEvent(event: TEvents, socket: LiveViewSocket<TContext, TInfos>): void;
    handleInfo(info: TInfos, socket: LiveViewSocket<TContext, TInfos>): void;
    handleParams(url: URL, socket: LiveViewSocket<TContext, TInfos>): void;
    shutdown(id: string, context: TContext): void | Promise<void>;
    abstract render(context: TContext, meta: LiveViewMeta<TEvents>): LiveViewTemplate | Promise<LiveViewTemplate>;
}
/**
 * Set of methods that can (or must be) defined when using the `createLiveView` factory function.
 * @see `createLiveView`, `LiveView`, `BaseLiveView`
 */
interface BaseLiveViewParams<TContext extends LiveContext = AnyLiveContext, TEvents extends LiveEvent = AnyLiveEvent, TInfos extends LiveInfo = AnyLiveInfo> {
    mount?: (socket: LiveViewSocket<TContext, TInfos>, session: Partial<SessionData>, params: LiveViewMountParams) => void | Promise<void>;
    handleParams?: (url: URL, socket: LiveViewSocket<TContext, TInfos>) => void | Promise<void>;
    handleEvent?: (event: TEvents, socket: LiveViewSocket<TContext, TInfos>) => void | Promise<void>;
    handleInfo?: (info: TInfos, socket: LiveViewSocket<TContext, TInfos>) => void | Promise<void>;
    shutdown?: (id: string, context: TContext) => void | Promise<void>;
    render(context: TContext, meta: LiveViewMeta<TEvents>): LiveViewTemplate | Promise<LiveViewTemplate>;
}
/**
 * Functional `LiveView` factory method for generating a `LiveView`.
 * @param params the BaseLiveViewParams with methods available to implement for a `LiveView`
 * @returns the `LiveView` instance
 */
declare const createLiveView: <TContext extends LiveContext = AnyLiveContext, TEvents extends LiveEvent = AnyLiveEvent, TInfos extends LiveInfo = AnyLiveInfo>(params: BaseLiveViewParams<TContext, TEvents, TInfos>) => LiveView<TContext, TEvents, TInfos>;
/**
 * LiveViewTemplate renderer that lays out the html elements for all of
 * the `LiveView`.  It is required that this page sets the csrf meta tag using
 * the passed in `csrfToken` and  required that it embeds the passed in `LiveViewTemplate`
 * content.
 */
declare type LiveViewHtmlPageTemplate = (pageTitleDefault: LiveTitleOptions, csrfToken: string, content: LiveViewTemplate) => LiveViewTemplate | Promise<LiveViewTemplate>;
/**
 * Define a renderer that can embed a rendered `LiveView` and is given access to the
 * session data.  Often used to as a common container for `LiveView`s that adds "flash"
 * messages and other common UI elements.  It is required that this renderer embeds the
 * passed in `LiveViewTemplate` content.
 */
declare type LiveViewWrapperTemplate = (sessionData: SessionData, content: LiveViewTemplate) => LiveViewTemplate | Promise<LiveViewTemplate>;

interface LiveComponentMeta {
    /**
     * the id of the component if it is stateful or undefined if it is stateless.
     * Generally used to identify this component in a `phx-target` attribute of
     * a `LiveViewTemplate`.
     *
     * Note this is not the same as the `id` property of the component, rather it
     * is the index of the `LiveComponent` in the `LiveView`.
     */
    myself?: number;
}
/**
 * Represents the `LiveComponent`'s websocket connectedness along with current
 * state of the component.  Also provides a method for sending messages
 * internally to the parent `LiveView`.
 */
interface LiveComponentSocket<TContext extends LiveContext = AnyLiveContext, TInfo extends LiveInfo = AnyLiveInfo> {
    /**
     * The id of the parent `LiveView`
     */
    id: string;
    /**
     * Whether the websocket is connected (i.e. http request or joined via websocket)
     * true if connected to a websocket, false for http request
     */
    connected: boolean;
    /**
     * Read-only, current state of the `LiveComponent`
     */
    context: TContext;
    /**
     * helper method to send messages to the parent `LiveView` via the `handleInfo`
     */
    sendParentInfo(info: Info<TInfo>): void;
    /**
     * `assign` is used to update the `Context` (i.e. state) of the `LiveComponent`
     */
    assign(context: Partial<TContext>): void;
    /**
     * helper method to send events to Hooks on the parent `LiveView`
     */
    pushEvent(pushEvent: AnyLivePushEvent): void;
}
declare abstract class BaseLiveComponentSocket<TContext extends LiveContext = AnyLiveContext, TInfo extends LiveInfo = AnyLiveInfo> implements LiveComponentSocket<TContext, TInfo> {
    readonly id: string;
    private _context;
    constructor(id: string, context: TContext);
    get context(): TContext;
    assign(context: Partial<TContext>): void;
    sendParentInfo(info: Info<TInfo>): void;
    pushEvent(pushEvent: AnyLivePushEvent): void;
    abstract connected: boolean;
}
declare class HttpLiveComponentSocket<TContext extends LiveContext = AnyLiveContext, TInfo extends LiveInfo = AnyLiveInfo> extends BaseLiveComponentSocket<TContext, TInfo> {
    readonly connected: boolean;
    constructor(id: string, context: TContext);
}
declare class WsLiveComponentSocket<TContext extends LiveContext = AnyLiveContext, TInfo extends LiveInfo = AnyLiveInfo> extends BaseLiveComponentSocket<TContext, TInfo> {
    readonly connected: boolean;
    private sendParentCallback;
    private pushEventCallback;
    constructor(id: string, context: TContext, sendParentCallback: (info: Info<TInfo>) => void, pushEventCallback: (pushEvent: AnyLivePushEvent) => void);
    sendParentInfo(info: Info<TInfo>): void;
    pushEvent(pushEvent: AnyLivePushEvent): void;
}
/**
 * A `LiveComponent` is a component that is embedded in a `LiveView` via
 * the `live_component` helper.  Their lifecycle is managed by and the same length
 * as their parent `LiveView`.
 *
 * `LiveComponent`s can be stateless or stateful.  Stateless components' lifecycle
 * consists of running `preload`, `mount`, `update`, and `render` when any new data is received
 * (via the `live_component` helper).  Stateful components' lifecycle consists is different.
 * Stateful components' lifecycle consists of running `preload` `mount`, `update`, and `render`
 * on the first time a `LiveComponent` is loaded followed by `preload`, `update`, and `render` on
 * subsequent renders.  In other words, subsequent updates only run `preload`, `update` and `render`
 * and the state (contenxt) is managed for the lifecycle of the `LiveView`.
 *
 * To make a `LiveComponent` stateful, you must pass an `id` to the `live_component` helper in the
 * `LiveView` template.
 */
interface LiveComponent<TContext extends LiveContext = AnyLiveContext, TEvents extends LiveEvent = AnyLiveEvent, TInfo extends LiveInfo = AnyLiveInfo> {
    /**
     * `preload` is useful when multiple `LiveComponent`s of the same type are loaded
     * within the same `LiveView` and you want to preload data for all of them in batch.
     * This helps to solve the N+1 query problem.
     * @param contextsList
     */
    /**
     * Mounts the `LiveComponent`'s stateful context.  This is called only once
     * for stateful `LiveComponent` and every render for a stateless `LiveComponent`.
     * This is called prior to `update` and `render`.
     *
     * @param socket a `LiveComponentSocket` with the context for this `LiveComponent`
     */
    mount(socket: LiveComponentSocket<TContext, TInfo>): void | Promise<void>;
    /**
     * Allows the `LiveComponent` to update its stateful context.  This is called
     * prior to `render` for both stateful and stateless `LiveComponent`s.  This is a
     * good place to add additional business logic to the `LiveComponent` if you
     * need to change the context (e.g. derive data from or transform) of the `LiveComponentSocket`.
     *
     * @param socket a `LiveComponentSocket` with the context for this `LiveComponent`
     */
    update(socket: LiveComponentSocket<TContext, TInfo>): void | Promise<void>;
    /**
     * Optional method that handles events from the `LiveComponent` initiated by the end-user. Only
     * called for "stateful" `LiveComponent`s (i.e. `LiveComponent`s with an "id" in their context).
     * In other words, only components with an `id` attribute in their "LiveContext" can handleEvents.
     * @param event the `TEvents` received from client
     * @param socket a `LiveComponentSocket` with the context for this `LiveComponent`
     */
    handleEvent?: (event: TEvents, socket: LiveComponentSocket<TContext, TInfo>) => void | Promise<void>;
    /**
     * Renders the `LiveComponent` by returning a `LiveViewTemplate`.  Each time a
     * a `LiveComponent` receives new data, it will be re-rendered.
     * @param context the current state for this `LiveComponent`
     * @param meta a `LiveComponentMeta` with additional meta data for this `LiveComponent`
     */
    render(context: TContext, meta: LiveComponentMeta): LiveViewTemplate | Promise<LiveViewTemplate>;
}
/**
 * Abstract base class implementation of a `LiveComponent` which can be used by
 * either a stateful or stateless `LiveComponent`.  `BaseLiveComponent` implements
 * `preload`, `mount`, `update`, and `handleEvent` with no-op implementations. Therefore
 * one can extend this class and simply implement the `render` function.  If you have
 * a stateful `LiveComponent` you most likely want to implement at least `mount` and
 * perhaps `update` as well.  See `LiveComponent` for more details.
 */
declare abstract class BaseLiveComponent<TContext extends LiveContext = AnyLiveContext, TEvents extends LiveEvent = AnyLiveEvent, TInfo extends LiveInfo = AnyLiveInfo> implements LiveComponent<TContext, TEvents, TInfo> {
    mount(socket: LiveComponentSocket<TContext, TInfo>): void;
    update(socket: LiveComponentSocket<TContext, TInfo>): void;
    abstract render(context: TContext, meta: LiveComponentMeta): LiveViewTemplate | Promise<LiveViewTemplate>;
}
/**
 * Shape of parameters passed to the `createLiveComponent` factory function to create a `LiveComponent`.
 * @see `createLiveComponent`
 * @see `LiveComponent`
 */
interface CreateLiveComponentParams<TContext extends LiveContext = AnyLiveContext, TEvents extends LiveEvent = AnyLiveEvent, TInfos extends LiveInfo = AnyLiveInfo> {
    mount?: (socket: LiveComponentSocket<TContext, TInfos>) => void | Promise<void>;
    update?: (socket: LiveComponentSocket<TContext, TInfos>) => void | Promise<void>;
    handleEvent?: (event: TEvents, socket: LiveComponentSocket<TContext, TInfos>) => void | Promise<void>;
    render(context: TContext, meta: LiveComponentMeta): LiveViewTemplate | Promise<LiveViewTemplate>;
}
/**
 * Creates a `LiveComponent` given the `CreateLiveComponentParams` and shape of the `LiveContext`, `LiveEvent` and `LiveInfo`.
 * @param params the `CreateLiveComponentParams` with optionally implemented methods for each
 * @returns the `LiveComponent` instance
 */
declare const createLiveComponent: <TContext extends LiveContext = AnyLiveContext, TEvents extends LiveEvent = AnyLiveEvent, TInfos extends LiveInfo = AnyLiveInfo>(params: CreateLiveComponentParams<TContext, TEvents, TInfos>) => LiveComponent<TContext, TEvents, TInfos>;

/**
 * Maps a route to a LiveView.
 * e.g. `"/users": UserListLiveView`
 * Routes can be optionally contain parameters which LiveViewJS will automatically
 * extract from the URL path and pass to the LiveView's `mount` method as part
 * of the `params` object.
 * e.g. `"/users/:id": UserLiveView` => `{ id: "123" }`
 */
interface LiveViewRouter {
    [key: string]: LiveView<AnyLiveContext, AnyLiveEvent, AnyLiveInfo>;
}
/**
 * Type representing parameters extracted from a URL path.
 */
declare type PathParams = {
    [key: string]: string;
};
/**
 * Helper function that returns a tuple containing the `LiveView` and
 * the `MatchResult` object containing the parameters extracted from the URL path
 * if there is a match.  Returns `undefined` if there is no match.
 * Used internally to match a URL path to a LiveView class for both HTTP and WS
 * requests.
 * @param router the `LiveViewRouter` object
 * @param path the URL path to match
 * @returns a tuple containing the `LiveView` and the `MatchResult` object or `undefined`
 */
declare function matchRoute(router: LiveViewRouter, path: string): [LiveView<AnyLiveContext, AnyLiveEvent, AnyLiveInfo>, MatchResult<PathParams>] | undefined;

interface LiveViewTemplate extends HtmlSafeString {
}

/**
 * Type that defines a function that returns a string ID used to identify a unique http request
 * and/or websocket connection.  Should generate unique IDs for each request and connection.  Good
 * concrete implementations are: nanoid, shortid, uuidv4 (though these are long).
 */
declare type IdGenerator = () => string;

/**
 * A class that knows how to serialize (Ser) and deserialize (De) session data.  This is used to pass
 * session data from the initial http request to the websocket connection.  You should use a strategy that
 * cannot be tampered with such as signed JWT tokens or other cryptographically safe serialization/deserializations.
 */
interface SerDe<T = any, F = string> {
    serialize(data: T): Promise<F>;
    deserialize(data: F): Promise<T>;
}

/**
 * An interface that represents how to extract required data from an HTTP server request (such as Express, Koa, etc in the
 * Node ecosystem or Oak on the Deno ecosystem) for handling a LiveView http request.
 */
interface HttpRequestAdaptor {
    /**
     * Make available SessionData from the HTTP request
     */
    getSessionData: () => SessionData;
    /**
     * Expose the HTTP request URL
     */
    getRequestUrl: () => URL;
    /**
     * Expose the path of the HTTP request URL
     */
    getRequestPath: () => string;
    /**
     * Callback to the adaptor that a redirect should be perfermed with the given url
     */
    onRedirect: (toUrl: string) => void;
    /**
     * Make available the SerDe for serializing and deserializing session data.
     */
    getSerDe: () => SerDe;
}
/**
 * Use the given inputs to handle (e.g. generate the HTML) for the requested LiveView. Usually this
 * is called via HTTP server middleware that determines if a request is to a LiveView and if so,
 * creates and passes all of the required inputs to this function
 * @param idGenerator the @{IdGenerator} to use to generate unique IDs for the HTTP request and web socket connection
 * @param csrfGenerator the @{CsrfGenerator} to use to generate unique CSRF tokens to protect against CSRF attacks
 * @param liveView the @{LiveView} to render
 * @param adaptor the @{HttpRequestAdaptor} to use to extract required data from the HTTP request
 * @param rootTemplateRenderer the @{LiveViewTemplate} which this @{LiveView} is rendered within (typically reused across all LiveViews)
 * @param pageTitleDefaults optional @{PageTitleDefaults} to use to set the page title for the LiveView
 * @param liveViewTemplateRenderer optional @{LiveViewTemplate} used for adding additional content to the LiveView (typically reused across all LiveViews)
 * @returns the HTML for the HTTP server to return to the client
 */
declare const handleHttpLiveView: (idGenerator: IdGenerator, csrfGenerator: CsrfGenerator, liveView: LiveView, adaptor: HttpRequestAdaptor, pageRenderer: LiveViewHtmlPageTemplate, pathParams: PathParams, pageTitleDefaults?: LiveTitleOptions, rootRenderer?: LiveViewWrapperTemplate) => Promise<string | undefined>;

/**
 * Naive implementation of flash adaptor that uses "__flash" property on session data
 * to implement flash.
 */
declare class SessionFlashAdaptor implements FlashAdaptor {
    peekFlash(session: SessionData, key: string): Promise<string | undefined>;
    popFlash(session: SessionData, key: string): Promise<string | undefined>;
    putFlash(session: SessionData, key: string, value: string): Promise<void>;
    clearFlash(session: SessionData, key: string): Promise<void>;
}

/**
 * Validation errors keyed by properties of T
 */
declare type LiveViewChangesetErrors<T> = {
    [Property in keyof T]?: string;
};
/**
 * A changeset represents the transition from one state of a data model to an updated
 * state and captures the changes, any validation errors that the changes may have had,
 * whether the changes are valid, and the data represented by the changeset.  Changesets are
 * useful for modeling data in HTML forms through their validation and submission.
 */
interface LiveViewChangeset<T> {
    /**
     * Optional string representing the action occuring on the changeset. If the action is not
     * present on a changeset, the validation rules are NOT applied.  This is useful for "empty"
     * changesets used to model an empty form.
     */
    action?: string;
    /**
     * The properties of T that have changed between the initial state and the updated state.
     */
    changes: Partial<T>;
    /**
     * The validation errors keyed by the field names of T.
     */
    errors?: LiveViewChangesetErrors<T>;
    /**
     * The merged data between the initial state and the updated state.
     */
    data: T | Partial<T>;
    /**
     * Whether the changeset is valid.  A changeset is valid if there are no validation errors.  Note again,
     * an undefined action means no validation rules will be applied and thus there will be no validation
     * errors in that case and the changeset will be considered valid.
     */
    valid: boolean;
}
/**
 * A factory for creating a changeset for a given existing data model, updated data model, and optional action.
 */
declare type LiveViewChangesetFactory<T> = (existing: Partial<T>, newAttrs: Partial<T>, action?: string) => LiveViewChangeset<T>;
/**
 * Generates a LiveViewChangesetFactory for the type T and the provided zod schema.  The provided schema
 * and type must have the same properties and generally the type is infered from the schema using zod's
 * infer.
 * e.g.
 *   const mySchema = zod.object({ name: zod.string() });
 *   type myType = z.infer<typeof mySchema>;
 *   const myFactory = newChangesetFactory<myType>(mySchema);
 * @param schema the zod schema to use for validation
 * @returns a LiveViewChangesetFactory for the provided schema and type
 */
declare const newChangesetFactory: <T>(schema: SomeZodObject) => LiveViewChangesetFactory<T>;

declare type MimeSource = "apache" | "iana" | "nginx";
interface MimeDB {
    [key: string]: {
        /**
         * Where the mime type is defined. If not set, it's probably a custom media type.
         */
        source?: string;
        /**
         * Known extensions associated with this mime type
         */
        extensions: string[];
        /**
         * Whether a file of this type can be gzipped.
         */
        compressible?: boolean;
        /**
         * The default charset associated with this type, if any.
         */
        charset?: string;
    };
}
/**
 * A class for looking up mime type extensions built on top of the mime-db.
 */
declare class Mime {
    #private;
    db: MimeDB;
    extensions: {
        [key: string]: string[];
    };
    constructor();
    /**
     * Given a mime type, return the string[] of extensions associated with it.
     * @param mimeType the string mime type to lookup
     * @returns the string[] of extensions associated with the mime type or an empty array if none are found.
     */
    lookupExtensions(mimeType: string): string[];
    /**
     * Given an extension (without the leading dot), return the string[] of mime types associated with it.
     * @param ext the extension (without leading dot) to lookup
     * @returns the string[] of mime types associated with the extension or an empty array if none are found.
     */
    lookupMimeType(ext: string): string[];
    get loaded(): boolean;
    load(): Promise<void>;
}
/**
 * Fallback implementation of getting JSON from a URL for Node <18.
 * @param url the url to fetch
 * @returns the JSON object returned from the URL
 */
declare function nodeHttpFetch<T>(url: string): Promise<T>;
declare const mime: Mime;

/**
 * Interface for LiveViewServerAdaptors to implement for a given runtime and web server.
 * e.g. NodeExpressServerAdaptor or DenoOakServerAdaptor
 */
interface LiveViewServerAdaptor<THttpMiddleware, TWsMiddleware> {
    httpMiddleware(): THttpMiddleware;
    wsMiddleware(): TWsMiddleware;
}

export { AnyLiveContext, AnyLiveEvent, AnyLiveInfo, AnyLivePushEvent, BaseLiveComponent, BaseLiveView, ConsumeUploadedEntriesMeta, CsrfGenerator, FileSystemAdaptor, FlashAdaptor, HtmlSafeString, HttpLiveComponentSocket, HttpLiveViewSocket, HttpRequestAdaptor, IdGenerator, Info, JS, LiveComponent, LiveComponentMeta, LiveComponentSocket, LiveContext, LiveEvent, LiveInfo, LiveTitleOptions, LiveView, LiveViewChangeset, LiveViewChangesetErrors, LiveViewChangesetFactory, LiveViewHtmlPageTemplate, LiveViewManager, LiveViewMeta, LiveViewMountParams, LiveViewRouter, LiveViewServerAdaptor, LiveViewSocket, LiveViewTemplate, LiveViewWrapperTemplate, MimeSource, Parts, PathParams, Phx, PubSub, Publisher, SerDe, SessionData, SessionFlashAdaptor, SingleProcessPubSub, Subscriber, SubscriberFunction, SubscriberId, UploadConfig, UploadConfigOptions, UploadEntry, WsAdaptor, WsCloseListener, WsHandler, WsHandlerConfig, WsHandlerContext, WsLiveComponentSocket, WsLiveViewSocket, WsMessageRouter, WsMsgListener, createLiveComponent, createLiveView, deepDiff, diffArrays, diffArrays2, error_tag, escapehtml, form_for, handleHttpLiveView, html, join, live_file_input, live_img_preview, live_patch, live_title_tag, matchRoute, mime, newChangesetFactory, nodeHttpFetch, options_for_select, safe, submit, telephone_input, text_input };
