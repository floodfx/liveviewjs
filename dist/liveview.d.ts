/// <reference types="node" />
import { SomeZodObject } from 'zod';

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
 * Adaptor that enables sending websocket messages over a concrete websocket implementation.
 */
interface WsAdaptor {
    send(message: string, errorHandler?: (err: any) => void): void;
}

declare type SubscriberFunction<T> = (data: T) => void;
declare type SubscriberId = string;
interface Subscriber {
    subscribe<T extends {
        type: string;
    }>(topic: string, subscriber: SubscriberFunction<T>): Promise<SubscriberId>;
    unsubscribe(topic: string, subscriberId: SubscriberId): Promise<void>;
}
interface Publisher {
    broadcast<T extends {
        type: string;
    }>(topic: string, data: T): Promise<void>;
}
interface PubSub extends Subscriber, Publisher {
}

declare class SingleProcessPubSub implements Subscriber, Publisher {
    private subscribers;
    subscribe<T>(topic: string, subscriber: SubscriberFunction<T>): Promise<string>;
    broadcast<T>(topic: string, data: T): Promise<void>;
    unsubscribe(topic: string, subscriberId: string): Promise<void>;
}

declare type PhxIncomingMessage<Payload> = [
    joinRef: string | null,
    messageRef: string | null,
    topic: "phoenix" | string,
    event: "phx_join" | "event" | "heartbeat" | "live_patch" | "phx_leave",
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
interface PhxEventPayload<TType extends string, TValue, TEvent extends string = string> {
    type: TType;
    event: TEvent;
    value: TValue;
    cid?: number;
}
interface PhxEventUploads {
    uploads: {
        [key: string]: unknown;
    };
}
declare type PhxClickPayload = PhxEventPayload<"click", {
    value: string;
}>;
declare type PhxLVClearFlashPayload = PhxEventPayload<"click", {
    key: string;
}, "lv:clear-flash">;
declare type PhxFormPayload = PhxEventPayload<"form", {
    value: string;
}> & PhxEventUploads;
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
};

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
    private csrfToken?;
    private _infoQueue;
    private _events;
    private _pageTitle;
    private pageTitleChanged;
    private socket;
    private liveViewRootTemplate?;
    private hasWarnedAboutMissingCsrfToken;
    private _parts;
    private _cidIndex;
    constructor(liveView: LiveView, connectionId: string, wsAdaptor: WsAdaptor, serDe: SerDe, pubSub: PubSub, flashAdaptor: FlashAdaptor, liveViewRootTemplate?: LiveViewRootRenderer);
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
     * Repeats a function every `intervalMillis` milliseconds until `shutdown` is called.
     * @param fn
     * @param intervalMillis
     */
    private repeat;
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

declare type Info<TInfo extends LiveInfo> = TInfo["type"] | TInfo;
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
     * Pushes data from the server to the client with the given event name and
     * params.  Requires a client `Hook` to be defined and to be listening for
     * the event via `this.handleEvent` callback.
     *
     * @param event the name of the event to push to the client
     * @param params the data to pass to the client
     */
    pushEvent(pushEvent: AnyLivePushEvent): void;
    /**
     * Updates the browser's URL with the given path and query parameters.
     *
     * @param path the path whose query params are being updated
     * @param params the query params to update the path with
     * @param replaceHistory whether to replace the current history entry or push a new one (defaults to false)
     */
    pushPatch(path: string, params?: URLSearchParams, replaceHistory?: boolean): Promise<void>;
    /**
     * Shutdowns the current `LiveView` and load another `LiveView` in its place without reloading the
     * whole page (i.e. making a full HTTP request).  Can be used to remount the current `LiveView` if
     * need be. Use `pushPatch` to update the current `LiveView` without unloading and remounting.
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
     * Send info internally to the server which initiates a `LiveView.handleInfo` invocation.
     *
     * @param event the event to send to `handleInfo`
     */
    sendInfo(info: Info<TInfos>): void;
    /**
     * Subscribes to the given topic using pub/sub.  Data published to this topic
     * will be received by the `LiveView` instance via `handleInfo`.
     *
     * @param topic the topic to subscribe this `LiveView` to
     */
    subscribe(topic: string): Promise<void>;
}
declare abstract class BaseLiveViewSocket<TContext extends LiveContext = AnyLiveContext, TInfo extends LiveInfo = AnyLiveInfo> implements LiveViewSocket<TContext, TInfo> {
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
    repeat(fn: () => void, intervalMillis: number): void;
    sendInfo(info: Info<TInfo>): void;
    subscribe(topic: string): Promise<void>;
    updateContextWithTempAssigns(): void;
}
/**
 * Used to render Http requests for `LiveView`s.  Only support setting the context via
 * `assign` and reading the context via `context`.
 */
declare class HttpLiveViewSocket<TContext extends LiveContext = AnyLiveContext, TInfo extends LiveInfo = AnyLiveInfo> extends BaseLiveViewSocket<TContext, TInfo> {
    readonly id: string;
    readonly connected: boolean;
    private _redirect;
    constructor(id: string);
    get redirect(): {
        to: string;
        replace: boolean;
    } | undefined;
    pushRedirect(path: string, params?: URLSearchParams, replaceHistory?: boolean): Promise<void>;
}
/**
 * Full inmplementation used once a `LiveView` is mounted to a websocket.
 */
declare class WsLiveViewSocket<TContext extends LiveContext = AnyLiveContext, TInfo extends LiveInfo = AnyLiveInfo> extends BaseLiveViewSocket<TContext, TInfo> {
    readonly id: string;
    readonly connected: boolean;
    private pageTitleCallback;
    private pushEventCallback;
    private pushPatchCallback;
    private pushRedirectCallback;
    private putFlashCallback;
    private repeatCallback;
    private sendInfoCallback;
    private subscribeCallback;
    constructor(id: string, pageTitleCallback: (newPageTitle: string) => void, pushEventCallback: (pushEvent: AnyLivePushEvent) => void, pushPatchCallback: (path: string, params?: URLSearchParams, replaceHistory?: boolean) => void, pushRedirectCallback: (path: string, params?: URLSearchParams, replaceHistory?: boolean) => void, putFlashCallback: (key: string, value: string) => void, repeatCallback: (fn: () => void, intervalMillis: number) => void, sendInfoCallback: (info: Info<TInfo>) => void, subscribeCallback: (topic: string) => void);
    putFlash(key: string, value: string): Promise<void>;
    pageTitle(newPageTitle: string): void;
    pushEvent(pushEvent: AnyLivePushEvent): void;
    pushPatch(path: string, params?: URLSearchParams, replaceHistory?: boolean): Promise<void>;
    pushRedirect(path: string, params?: URLSearchParams, replaceHistory?: boolean): Promise<void>;
    repeat(fn: () => void, intervalMillis: number): void;
    sendInfo(info: Info<TInfo>): void;
    subscribe(topic: string): Promise<void>;
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
    private liveViewRootTemplate?;
    constructor(router: LiveViewRouter, pubSub: PubSub, flashAdaptor: FlashAdaptor, serDe: SerDe, liveViewRootTemplate?: LiveViewRootRenderer);
    onMessage(connectionId: string, messageString: string, wsAdaptor: WsAdaptor): Promise<void>;
    onClose(connectionId: string): Promise<void>;
    private onPhxJoin;
}

declare function deepDiff(oldParts: Parts, newParts: Parts): Parts;
declare function diffArrays(oldArray: unknown[], newArray: unknown[]): boolean;
declare function diffArrays2<T extends Parts | string>(oldArray: T[], newArray: T[]): T[];

declare function join(array: (string | HtmlSafeString)[], separator?: string | HtmlSafeString): HtmlSafeString;
declare function safe(value: unknown): HtmlSafeString;
declare function escapehtml(unsafe: unknown): string;
declare type Parts = {
    [key: string]: unknown;
};
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
declare const form_for: <T>(action: string, csrfToken: string, options?: FormForOptions | undefined) => HtmlSafeString;

interface InputOptions {
    placeholder?: string;
    autocomplete?: "off" | "on";
    phx_debounce?: number | "blur" | "focus";
    type?: "text" | "tel";
    className?: string;
}
declare const text_input: <T>(changeset: LiveViewChangeset<T>, key: keyof T, options?: InputOptions | undefined) => HtmlSafeString;
interface TelephoneInputOptions extends Omit<InputOptions, "type"> {
}
declare const telephone_input: <T>(changeset: LiveViewChangeset<T>, key: keyof T, options?: TelephoneInputOptions | undefined) => HtmlSafeString;
interface ErrorTagOptions {
    className?: string;
}
declare const error_tag: <T>(changeset: LiveViewChangeset<T>, key: keyof T, options?: ErrorTagOptions | undefined) => HtmlSafeString;

interface LiveViewPatchHelperOptions {
    to: {
        path: string;
        params?: Record<string, string>;
    };
    className?: string;
}
declare const live_patch: (anchorBody: HtmlSafeString | string, options: LiveViewPatchHelperOptions) => HtmlSafeString;

interface LiveTitleTagOptions {
    prefix?: string;
    suffix?: string;
}
declare const live_title_tag: (title: string, options?: LiveTitleTagOptions | undefined) => HtmlSafeString;

declare type Options = string[] | Record<string, string>;
declare type Selected = string | string[];
declare const options_for_select: (options: Options, selected?: Selected | undefined) => HtmlSafeString;

interface PageTitleDefaults {
    prefix?: string;
    suffix?: string;
    title: string;
}

interface SubmitOptions {
    phx_disable_with: string;
}
declare const submit: (label: string, options?: SubmitOptions | undefined) => HtmlSafeString;

interface LiveContext {
    [key: string]: any;
}
interface AnyLiveContext extends LiveContext {
    [key: string]: any;
}
interface LiveEvent {
    type: string;
}
interface AnyLiveEvent extends LiveEvent {
    [key: string]: string;
}
interface LiveInfo {
    type: string;
}
interface AnyLiveInfo extends LiveInfo {
    [key: string]: any;
}
interface AnyLivePushEvent extends LiveEvent {
    [key: string]: any;
}
/**
 * Paramter passed into the `mount` function of a LiveView.
 */
interface LiveViewMountParams {
    /**
     * The cross site request forgery token from the `LiveView` html page.
     */
    ["_csrf_token"]: string;
    /**
     * The number of mounts for this `LiveView`.
     */
    ["_mounts"]: number;
}
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
}
declare type Event<TEvent extends LiveEvent> = TEvent["type"];
/**
 * Meta data and helpers for `LiveView`s.
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
}
/**
 * Abstract `LiveView` class that is easy to extend for any class-based `LiveView`
 */
declare abstract class BaseLiveView<TContext extends LiveContext = AnyLiveContext, TEvents extends LiveEvent = AnyLiveEvent, TInfos extends LiveInfo = AnyLiveInfo> implements LiveView<TContext, TEvents, TInfos> {
    mount(socket: LiveViewSocket<TContext, TInfos>, session: Partial<SessionData>, params: LiveViewMountParams): void;
    handleEvent(event: TEvents, socket: LiveViewSocket<TContext, TInfos>): void;
    handleInfo(info: TInfos, socket: LiveViewSocket<TContext, TInfos>): void;
    handleParams(url: URL, socket: LiveViewSocket<TContext, TInfos>): void;
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
declare type LiveViewPageRenderer = (pageTitleDefault: PageTitleDefaults, csrfToken: string, content: LiveViewTemplate) => LiveViewTemplate | Promise<LiveViewTemplate>;
/**
 * Define a renderer that can embed a rendered `LiveView` and is given access to the
 * session data.  Often used to as a common container for `LiveView`s that adds "flash"
 * messages and other common UI elements.  It is required that this renderer embeds the
 * passed in `LiveViewTemplate` content.
 */
declare type LiveViewRootRenderer = (sessionData: SessionData, content: LiveViewTemplate) => LiveViewTemplate | Promise<LiveViewTemplate>;

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

interface LiveViewTemplate extends HtmlSafeString {
}
interface LiveViewRouter {
    [key: string]: LiveView<AnyLiveContext, AnyLiveEvent, AnyLiveInfo>;
}

/**
 * Type that defines a function that returns a string value used for protecting requests against
 * Cross-site Request Forgery (CSRF) attacks.  Good concrete implementations are: crypto.randomBytes, uuidv4.
 */
declare type CsrfGenerator = () => string;

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
interface SerDe {
    serialize<T>(data: T): Promise<string>;
    deserialize<T>(data: string): Promise<T>;
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
declare const handleHttpLiveView: (idGenerator: IdGenerator, csrfGenerator: CsrfGenerator, liveView: LiveView, adaptor: HttpRequestAdaptor, pageRenderer: LiveViewPageRenderer, pageTitleDefaults?: PageTitleDefaults | undefined, rootRenderer?: LiveViewRootRenderer | undefined) => Promise<string | undefined>;

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

/**
 * Interface for LiveViewServerAdaptors to implement for a given runtime and web server.
 * e.g. NodeExpressServerAdaptor or DenoOakServerAdaptor
 */
interface LiveViewServerAdaptor<TMiddlewareInterface> {
    httpMiddleware(): TMiddlewareInterface;
    wsRouter(): WsMessageRouter;
}

export { AnyLiveContext, AnyLiveEvent, AnyLiveInfo, AnyLivePushEvent, BaseLiveComponent, BaseLiveView, CsrfGenerator, Event, FlashAdaptor, HtmlSafeString, HttpLiveComponentSocket, HttpLiveViewSocket, HttpRequestAdaptor, IdGenerator, Info, LiveComponent, LiveComponentMeta, LiveComponentSocket, LiveContext, LiveEvent, LiveInfo, LiveView, LiveViewChangeset, LiveViewChangesetErrors, LiveViewChangesetFactory, LiveViewManager, LiveViewMeta, LiveViewMountParams, LiveViewPageRenderer, LiveViewRootRenderer, LiveViewRouter, LiveViewServerAdaptor, LiveViewSocket, LiveViewTemplate, PageTitleDefaults, Parts, PubSub, Publisher, SerDe, SessionData, SessionFlashAdaptor, SingleProcessPubSub, Subscriber, SubscriberFunction, SubscriberId, WsAdaptor, WsLiveComponentSocket, WsLiveViewSocket, WsMessageRouter, createLiveComponent, createLiveView, deepDiff, diffArrays, diffArrays2, error_tag, escapehtml, form_for, handleHttpLiveView, html, join, live_patch, live_title_tag, newChangesetFactory, options_for_select, safe, submit, telephone_input, text_input };
