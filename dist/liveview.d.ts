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
 * Main interface to update state, interact, manage, message, and otherwise
 * manage the lifecycle of a `LiveView`.
 *
 * The `LiveView` API (i.e. `mount`, `handleParams`, `handleInfo`, `handleEvent`)
 * are all passed `LiveViewSocket` which provide access to the current `LiveView`
 * context (via `context`) as well as various methods update the `LiveView` including
 * `assign` which updates the `LiveView`'s context (i.e. state).
 */
interface LiveViewSocket<TContext extends LiveContext = AnyLiveContext> {
    /**
     * The id of the `LiveView` (same as the `phx_join` id)
     */
    id: string;
    /**
     * Whether the websocket is connected.
     * true if connected to a websocket, false for http request
     */
    connected: boolean;
    /**
     * The current state of the `LiveView`
     */
    context: TContext;
    /**
     * `assign` is used to update the `Context` (i.e. state) of the `LiveComponent`
     * @param context you can pass a partial of the current context to update
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
    pushPatch(path: string, params?: URLSearchParams, replaceHistory?: boolean): void;
    /**
     * Shutdowns the current `LiveView` and load another `LiveView` in its place without reloading the
     * whole page (i.e. making a full HTTP request).  Can be used to remount the current `LiveView` if
     * need be. Use `pushPatch` to update the current `LiveView` without unloading and remounting.
     *
     * @param path the path whose query params are being updated
     * @param params the query params to update the path with
     * @param replaceHistory whether to replace the current history entry or push a new one (defaults to false)
     */
    pushRedirect(path: string, params?: URLSearchParams, replaceHistory?: boolean): void;
    /**
     * Add flash to the socket for a given key and value.
     * @param key
     * @param value
     */
    putFlash(key: string, value: string): void;
    /**
     * Runs the given function on the given interval until this `LiveView` is
     * unloaded.
     *
     * @param fn the function to run on the interval
     * @param intervalMillis the interval to run the function on in milliseconds
     */
    repeat(fn: () => void, intervalMillis: number): void;
    /**
     * Send an event internally to the server which initiates a `LiveView.handleInfo` invocation.
     *
     * @param event the event to send to `handleInfo`
     */
    send(info: AnyLiveInfo): void;
    /**
     * Subscribes to the given topic using pub/sub.  Any events published to the topic
     * will be received by the `LiveView` instance via `handleEvent`.
     *
     * @param topic the topic to subscribe this `LiveView` to
     */
    subscribe(topic: string): void;
}
declare abstract class BaseLiveViewSocket<TContext extends LiveContext = AnyLiveContext> implements LiveViewSocket<TContext> {
    abstract connected: boolean;
    abstract id: string;
    private _context;
    private _tempContext;
    get context(): TContext;
    assign(context: Partial<TContext>): void;
    tempAssign(tempContext: Partial<TContext>): void;
    pageTitle(newPageTitle: string): void;
    pushEvent(pushEvent: AnyLivePushEvent): void;
    pushPatch(path: string, params?: URLSearchParams, replaceHistory?: boolean): void;
    pushRedirect(path: string, params?: URLSearchParams, replaceHistory?: boolean): void;
    putFlash(key: string, value: string): void;
    repeat(fn: () => void, intervalMillis: number): void;
    send(info: AnyLiveInfo): void;
    subscribe(topic: string): void;
    updateContextWithTempAssigns(): void;
}
/**
 * Used to render Http requests for `LiveView`s.  Only support setting the context via
 * `assign` and reading the context via `context`.
 */
declare class HttpLiveViewSocket<Context> extends BaseLiveViewSocket<Context> {
    readonly id: string;
    readonly connected: boolean;
    private _redirect;
    constructor(id: string);
    get redirect(): {
        to: string;
        replace: boolean;
    } | undefined;
    pushRedirect(path: string, params?: URLSearchParams, replaceHistory?: boolean): void;
}
/**
 * Full inmplementation used once a `LiveView` is mounted to a websocket.
 */
declare class WsLiveViewSocket extends BaseLiveViewSocket {
    readonly id: string;
    readonly connected: boolean;
    pushEventData?: {
        event: string;
        params: Record<string, any>;
    };
    pageTitleData?: string;
    private pageTitleCallback;
    private pushEventCallback;
    private pushPatchCallback;
    private pushRedirectCallback;
    private putFlashCallback;
    private repeatCallback;
    private sendCallback;
    private subscribeCallback;
    constructor(id: string, pageTitleCallback: (newPageTitle: string) => void, pushEventCallback: (pushEvent: AnyLivePushEvent) => void, pushPatchCallback: (path: string, params?: URLSearchParams, replaceHistory?: boolean) => void, pushRedirectCallback: (path: string, params?: URLSearchParams, replaceHistory?: boolean) => void, putFlashCallback: (key: string, value: string) => void, repeatCallback: (fn: () => void, intervalMillis: number) => void, sendCallback: (info: AnyLiveInfo) => void, subscribeCallback: (topic: string) => void);
    putFlash(key: string, value: string): void;
    pageTitle(newPageTitle: string): void;
    pushEvent(pushEvent: AnyLivePushEvent): void;
    pushPatch(path: string, params?: URLSearchParams, replaceHistory?: boolean): void;
    pushRedirect(path: string, params?: URLSearchParams, replaceHistory?: boolean): void;
    repeat(fn: () => void, intervalMillis: number): void;
    send(info: AnyLiveInfo): void;
    subscribe(topic: string): void;
}

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
 * Paramter passed into the `mount` function of a LiveViewComponent.
 */
interface LiveViewMountParams {
    /**
     * The cross site request forgery token from the `LiveView` html page.
     */
    ["_csrf_token"]: string;
    /**
     * The number of mounts for this `LiveView` component.
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
     * `mount` is both when the `LiveView` is rendered for the HTTP request
     * and upon the first time the `LiveView` is mounted (i.e. connected) via
     * the websocket.  This is where you should load data and set the initial
     * context of the `LiveView`.
     * @param params the `LiveViewMountParams` for this `LiveView`
     * @param session the `SessionData` for this session (i.e. the user)
     * @param socket the `LiveViewSocket` for this `LiveView`
     */
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<TContext>): void | Promise<void>;
    /**
     * `render` is where the user interface is generated based on the `LiveView`'s
     * context and meta data.  This is called every lifecycle of the `LiveView`,
     * that is when internal or external events occur.
     * @param context the current state for this `LiveView`
     * @param meta the `LiveViewMeta` for this `LiveView`
     */
    render(context: TContext, meta: LiveViewMeta): LiveViewTemplate | Promise<LiveViewTemplate>;
    /**
     * `handleParams` is called on initial joining of the `LiveView` as well as on
     * `pushPatch` and `livePatch` events.  This is where you should handle any context (i.e. state)
     * changes that are based on the `LiveView`'s URL parameters.
     * @param params
     * @param url
     * @param socket
     */
    handleParams(url: URL, socket: LiveViewSocket<TContext>): void | Promise<void>;
    /**
     * Events initiated by the client (i.e. user interactions with the `LiveView` elements
     * that have the attributes `phx-click`, `phx-change`, `phx-submit`, etc) will be
     * passed into this handler.
     * @param event the (string) event to handle
     * @param params any parameters associated with the event
     * @param socket The `LiveViewSocket` for this `LiveView` component
     */
    handleEvent(event: TEvents, socket: LiveViewSocket<TContext>): void | Promise<void>;
    /**
     * Events initiated by the `LiveView` or `LiveComponent`s that are childern of this
     * `LiveView` are passed into this handler.
     * @param event The event to handle
     * @param socket The `LiveViewSocket` for the `LiveView` component
     */
    handleInfo(info: TInfos, socket: LiveViewSocket<TContext>): void | Promise<void>;
}
/**
 * Meta data and helpers for `LiveView` components.
 */
interface LiveViewMeta {
    /**
     * The cross site request forgery token from the `LiveView` html page which
     * should be used to validate form submissions.
     */
    csrfToken: string;
    /**
     * A helper for loading `LiveComponent`s within a `LiveView`.
     */
    live_component<Context extends LiveContext>(liveComponent: LiveComponent<Context>, params?: Partial<Context & {
        id: string | number;
    }>): Promise<LiveViewTemplate>;
}
/**
 * Abstract `LiveView` class that is easy to extend for any `LiveView`
 */
declare abstract class BaseLiveView<TContext extends LiveContext = AnyLiveContext, TEvents extends LiveEvent = AnyLiveEvent, TInfos extends LiveInfo = AnyLiveInfo> implements LiveView<TContext, TEvents, TInfos> {
    handleEvent(event: TEvents, socket: LiveViewSocket<TContext>): void | Promise<void>;
    handleInfo(info: TInfos, socket: LiveViewSocket<TContext>): void | Promise<void>;
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<TContext>): void;
    handleParams(url: URL, socket: LiveViewSocket<TContext>): void;
    abstract render(context: TContext, meta: LiveViewMeta): LiveViewTemplate | Promise<LiveViewTemplate>;
}

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
interface LiveComponentSocket<TContext extends LiveContext = AnyLiveContext> {
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
    send(info: AnyLiveInfo): void;
    /**
     * `assign` is used to update the `Context` (i.e. state) of the `LiveComponent`
     */
    assign(context: Partial<TContext>): void;
    /**
     * helper method to send events to Hooks on the parent `LiveView`
     */
    pushEvent(pushEvent: AnyLivePushEvent): void;
}
declare abstract class BaseLiveComponentSocket<TContext extends LiveContext = AnyLiveContext> implements LiveComponentSocket<TContext> {
    readonly id: string;
    private _context;
    constructor(id: string, context: TContext);
    get context(): TContext;
    assign(context: Partial<TContext>): void;
    send(info: AnyLiveInfo): void;
    pushEvent(pushEvent: AnyLivePushEvent): void;
    abstract connected: boolean;
}
declare class HttpLiveComponentSocket<TContext extends LiveContext = AnyLiveContext> extends BaseLiveComponentSocket<TContext> {
    readonly connected: boolean;
    constructor(id: string, context: TContext);
}
declare class WsLiveComponentSocket<TContext extends LiveContext = AnyLiveContext> extends BaseLiveComponentSocket<TContext> {
    readonly connected: boolean;
    private sendCallback;
    private pushEventCallback;
    constructor(id: string, context: TContext, sendCallback: (info: AnyLiveInfo) => void, pushEventCallback: (pushEvent: AnyLivePushEvent) => void);
    send(info: AnyLiveInfo): void;
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
interface LiveComponent<TContext extends LiveContext = AnyLiveContext, TEvents extends LiveEvent = AnyLiveEvent> {
    /**
     * `preload` is useful when multiple `LiveComponent`s of the same type are loaded
     * within the same `LiveView` and you want to preload data for all of them in batch.
     * This helps to solve the N+1 query problem.
     * @param contextsList
     */
    /**
     * Mounts the `LiveComponent`'s stateful context.  This is called only once
     * for stateful `LiveComponent` and always for a stateless `LiveComponent`.
     * This is called prior to `update` and `render`.
     *
     * @param socket a `LiveComponentSocket` with the context for this `LiveComponent`
     */
    mount(socket: LiveComponentSocket<TContext>): void | Promise<void>;
    /**
     * Allows the `LiveComponent` to update its stateful context.  This is called
     * prior to `render` for both stateful and stateless `LiveComponent`s.  This is a
     * good place to add additional business logic to the `LiveComponent` if you
     * need to manipulate or otherwise update the context.
     *
     * You only need to return a `Partial<Context>` with the changes you want to
     * make to the context.  The `LiveView` will merge the changes with the existing
     * state (context).
     *
     * @param context the current state for this `LiveComponent`
     * @param socket a `LiveComponentSocket` with the context for this `LiveComponent`
     */
    update(socket: LiveComponentSocket<TContext>): void | Promise<void>;
    /**
     * Renders the `LiveComponent` by returning a `LiveViewTemplate`.  Each time a
     * a `LiveComponent` receives new data, it will be re-rendered.
     * @param context the current state for this `LiveComponent`
     * @param meta a `LiveComponentMeta` with additional meta data for this `LiveComponent`
     */
    render(context: TContext, meta: LiveComponentMeta): LiveViewTemplate | Promise<LiveViewTemplate>;
    /**
     * Handles events from the `LiveView` initiated by the end-user
     * @param event a `LiveEvent` received from client
     * @param socket a `LiveComponentSocket` with the context for this `LiveComponent`
     */
    handleEvent(event: TEvents, socket: LiveComponentSocket<TContext>): void | Promise<void>;
}
/**
 * Abstract base class implementation of a `LiveComponent` which can be used by
 * either a stateful or stateless `LiveComponent`.  `BaseLiveComponent` implements
 * `preload`, `mount`, `update`, and `handleEvent` with no-op implementations. Therefore
 * one can extend this class and simply implement the `render` function.  If you have
 * a stateful `LiveComponent` you most likely want to implement at least `mount` and
 * perhaps `update` as well.  See `LiveComponent` for more details.
 */
declare abstract class BaseLiveComponent<TContext extends LiveContext = AnyLiveContext, TEvents extends LiveEvent = AnyLiveEvent> implements LiveComponent<TContext, TEvents> {
    mount(socket: LiveComponentSocket<TContext>): void;
    update(socket: LiveComponentSocket<TContext>): void;
    handleEvent(event: TEvents, socket: LiveComponentSocket<TContext>): void;
    abstract render(context: TContext, meta: LiveComponentMeta): LiveViewTemplate | Promise<LiveViewTemplate>;
}

declare function deepDiff(oldParts: Parts, newParts: Parts): Parts;
declare function diffArrays(oldArray: unknown[], newArray: unknown[]): boolean;

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
declare const form_for: <T>(action: string, options?: FormForOptions | undefined) => HtmlSafeString;

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

declare class Flash extends Map<string, string> {
    getFlash(key: string): string | undefined;
}

declare const live_flash: (flash: Flash | undefined, flashKey: string) => HtmlSafeString;

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

interface LiveViewTemplate extends HtmlSafeString {
}
interface LiveViewRouter {
    [key: string]: LiveView;
}

/**
 * Type that defines a function that returns a string ID used to identify a unique http request
 * and/or websocket connection.  Should generate unique IDs for each request and connection.  Good
 * concrete implementations are: nanoid, shortid, uuidv4 (though these are long).
 */
declare type IdGenerator = () => string;
/**
 * Type that defines a function that returns a string value used for protecting requests against
 * Cross-site Request Forgery (CSRF) attacks.  Good concrete implementations are: crypto.randomBytes, uuidv4.
 */
declare type CsrfGenerator = () => string;
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
declare const handleHttpLiveView: (idGenerator: IdGenerator, csrfGenerator: CsrfGenerator, liveView: LiveView, adaptor: HttpRequestAdaptor, rootTemplateRenderer: (pageTitleDefault: PageTitleDefaults, csrfToken: string, content: LiveViewTemplate) => LiveViewTemplate, pageTitleDefaults?: PageTitleDefaults | undefined, liveViewTemplateRenderer?: ((session: SessionData, liveViewContent: LiveViewTemplate) => LiveViewTemplate) | undefined) => Promise<string | undefined>;

/**
 * Adaptor that enables sending websocket messages over a concrete websocket implementation.
 */
interface WsAdaptor {
    send(message: string, errorHandler?: (err: any) => void): void;
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
interface PhxEventPayload<Type extends string, Value> {
    type: Type;
    event: string;
    value: Value;
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
    private urlBase;
    private wsAdaptor;
    private subscriptionIds;
    private liveView;
    private intervals;
    private session;
    private pubSub;
    private serDe;
    private csrfToken?;
    private _events;
    private _pageTitle;
    private pageTitleChanged;
    private socket;
    private liveViewRootTemplate?;
    constructor(component: LiveView, connectionId: string, wsAdaptor: WsAdaptor, serDe: SerDe, pubSub: PubSub, liveViewRootTemplate?: (sessionData: SessionData, innerContent: LiveViewTemplate) => LiveViewTemplate);
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
    onEvent(message: PhxIncomingMessage<PhxClickPayload | PhxFormPayload | PhxKeyUpPayload | PhxKeyDownPayload | PhxBlurPayload | PhxFocusPayload | PhxHookPayload>): Promise<void>;
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
     * @param pushEvent
     */
    private onPushEvent;
    /**
     * Handles sending `LiveInfo` events back to the `LiveView`'s `handleInfo` method.
     * @param info the `LiveInfo` event to dispatch to the `LiveView`
     */
    private sendInternal;
    private set pageTitle(value);
    private putFlash;
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

declare class WsMessageRouter {
    private serDe;
    private pubSub;
    private liveViewRootTemplate?;
    constructor(serDe: SerDe, pubSub: PubSub, liveViewRootTemplate?: (sessionData: SessionData, innerContent: LiveViewTemplate) => LiveViewTemplate);
    onMessage(wsAdaptor: WsAdaptor, messageString: string, router: LiveViewRouter, connectionId: string): Promise<void>;
    onClose(code: number, connectionId: string): Promise<void>;
    private onPhxJoin;
}

export { AnyLiveContext, AnyLiveEvent, AnyLiveInfo, AnyLivePushEvent, BaseLiveComponent, BaseLiveView, CsrfGenerator, HtmlSafeString, HttpLiveComponentSocket, HttpLiveViewSocket, HttpRequestAdaptor, IdGenerator, LiveComponent, LiveComponentMeta, LiveComponentSocket, LiveContext, LiveEvent, LiveInfo, LiveView, LiveViewChangeset, LiveViewChangesetErrors, LiveViewChangesetFactory, LiveViewManager, LiveViewMeta, LiveViewMountParams, LiveViewRouter, LiveViewSocket, LiveViewTemplate, PageTitleDefaults, Parts, PubSub, Publisher, SerDe, SessionData, SingleProcessPubSub, Subscriber, SubscriberFunction, SubscriberId, WsAdaptor, WsLiveComponentSocket, WsLiveViewSocket, WsMessageRouter, deepDiff, diffArrays, error_tag, escapehtml, form_for, handleHttpLiveView, html, join, live_flash, live_patch, live_title_tag, newChangesetFactory, options_for_select, safe, submit, telephone_input, text_input };
