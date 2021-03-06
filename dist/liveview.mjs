
/// <reference types="./liveview.d.ts" />
import crypto from 'crypto';
import EventEmitter from 'events';

class BaseLiveComponentSocket {
    id;
    _context;
    constructor(id, context) {
        this.id = id;
        this._context = context;
    }
    get context() {
        return this._context || {};
    }
    assign(context) {
        this._context = {
            ...this.context,
            ...context,
        };
    }
    sendParentInfo(info) {
        // no-op
    }
    pushEvent(pushEvent) {
        // no-op
    }
}
class HttpLiveComponentSocket extends BaseLiveComponentSocket {
    connected = false;
    constructor(id, context) {
        super(id, context);
    }
}
class WsLiveComponentSocket extends BaseLiveComponentSocket {
    connected = true;
    sendParentCallback;
    pushEventCallback;
    constructor(id, context, sendParentCallback, pushEventCallback) {
        super(id, context);
        this.sendParentCallback = sendParentCallback;
        this.pushEventCallback = pushEventCallback;
    }
    sendParentInfo(info) {
        this.sendParentCallback(info);
    }
    pushEvent(pushEvent) {
        this.pushEventCallback(pushEvent);
    }
}
/**
 * Abstract base class implementation of a `LiveComponent` which can be used by
 * either a stateful or stateless `LiveComponent`.  `BaseLiveComponent` implements
 * `preload`, `mount`, `update`, and `handleEvent` with no-op implementations. Therefore
 * one can extend this class and simply implement the `render` function.  If you have
 * a stateful `LiveComponent` you most likely want to implement at least `mount` and
 * perhaps `update` as well.  See `LiveComponent` for more details.
 */
class BaseLiveComponent {
    // preload(contextsList: Context[]): Partial<Context>[] {
    //   return contextsList;
    // }
    mount(socket) {
        // no-op
    }
    update(socket) {
        // no-op
    }
}
/**
 * Creates a `LiveComponent` given the `CreateLiveComponentParams` and shape of the `LiveContext`, `LiveEvent` and `LiveInfo`.
 * @param params the `CreateLiveComponentParams` with optionally implemented methods for each
 * @returns the `LiveComponent` instance
 */
const createLiveComponent = (params) => {
    return {
        // default imps
        mount: () => { },
        update: () => { },
        // replace default impls with params if they are defined
        ...params,
    };
};

/**
 * Abstract `LiveView` class that is easy to extend for any class-based `LiveView`
 */
class BaseLiveView {
    mount(socket, session, params) {
        // no-op
    }
    handleEvent(event, socket) {
        // istanbul ignore next
        console.warn(`handleEvent not implemented for ${this.constructor.name} but event received: ${JSON.stringify(event)}`);
    }
    handleInfo(info, socket) {
        // istanbul ignore next
        console.warn(`handleInfo not implemented for ${this.constructor.name} but info received: ${JSON.stringify(info)}`);
    }
    handleParams(url, socket) {
        // no-op
    }
}
/**
 * Functional `LiveView` factory method for generating a `LiveView`.
 * @param params the BaseLiveViewParams with methods available to implement for a `LiveView`
 * @returns the `LiveView` instance
 */
const createLiveView = (params) => {
    return {
        // default imps
        mount: () => { },
        handleParams: () => { },
        handleEvent: (event) => {
            // istanbul ignore next
            console.warn(`handleEvent not implemented in LiveView but event received: ${JSON.stringify(event)}`);
        },
        handleInfo: (info) => {
            // istanbul ignore next
            console.warn(`handleInfo not implemented in LiveView but info received: ${JSON.stringify(info)}`);
        },
        // replace default impls with params if they are defined
        ...params,
    };
};

class BaseLiveViewSocket {
    _context;
    _tempContext = {}; // values to reset the context to post render cycle
    get context() {
        return structuredClone(this._context || {});
    }
    assign(context) {
        this._context = {
            ...this.context,
            ...context,
        };
    }
    tempAssign(tempContext) {
        this._tempContext = {
            ...this._tempContext,
            ...tempContext,
        };
    }
    pageTitle(newPageTitle) {
        // no-op
    }
    pushEvent(pushEvent) {
        // no-op
    }
    pushPatch(path, params, replaceHistory) {
        // no-op
        // istanbul ignore next
        return Promise.resolve();
    }
    pushRedirect(path, params, replaceHistory) {
        // no-op
        // istanbul ignore next
        return Promise.resolve();
    }
    putFlash(key, value) {
        // no-op
        // istanbul ignore next
        return Promise.resolve();
    }
    repeat(fn, intervalMillis) {
        // no-op
    }
    sendInfo(info) {
        // no-op
    }
    subscribe(topic) {
        // no-op
        // istanbul ignore next
        return Promise.resolve();
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
class HttpLiveViewSocket extends BaseLiveViewSocket {
    id;
    connected = false;
    _redirect;
    constructor(id) {
        super();
        this.id = id;
    }
    get redirect() {
        return this._redirect;
    }
    pushRedirect(path, params, replaceHistory) {
        const to = params ? `${path}?${params}` : path;
        this._redirect = {
            to,
            replace: replaceHistory || false,
        };
        return Promise.resolve();
    }
}
/**
 * Full inmplementation used once a `LiveView` is mounted to a websocket.
 */
class WsLiveViewSocket extends BaseLiveViewSocket {
    id;
    connected = true;
    // callbacks to the ComponentManager
    pageTitleCallback;
    pushEventCallback;
    pushPatchCallback;
    pushRedirectCallback;
    putFlashCallback;
    repeatCallback;
    sendInfoCallback;
    subscribeCallback;
    constructor(id, pageTitleCallback, pushEventCallback, pushPatchCallback, pushRedirectCallback, putFlashCallback, repeatCallback, sendInfoCallback, subscribeCallback) {
        super();
        this.id = id;
        this.pageTitleCallback = pageTitleCallback;
        this.pushEventCallback = pushEventCallback;
        this.pushPatchCallback = pushPatchCallback;
        this.pushRedirectCallback = pushRedirectCallback;
        this.putFlashCallback = putFlashCallback;
        this.repeatCallback = repeatCallback;
        this.sendInfoCallback = sendInfoCallback;
        this.subscribeCallback = subscribeCallback;
    }
    async putFlash(key, value) {
        await this.putFlashCallback(key, value);
    }
    pageTitle(newPageTitle) {
        this.pageTitleCallback(newPageTitle);
    }
    pushEvent(pushEvent) {
        this.pushEventCallback(pushEvent);
    }
    async pushPatch(path, params, replaceHistory = false) {
        await this.pushPatchCallback(path, params, replaceHistory);
    }
    async pushRedirect(path, params, replaceHistory = false) {
        await this.pushRedirectCallback(path, params, replaceHistory);
    }
    repeat(fn, intervalMillis) {
        this.repeatCallback(fn, intervalMillis);
    }
    sendInfo(info) {
        this.sendInfoCallback(info);
    }
    async subscribe(topic) {
        await this.subscribeCallback(topic);
    }
}

// returns a Parts tree that only contains the differences between
// the oldParts tree and the newParts tree
function deepDiff(oldParts, newParts) {
    let diff = {};
    // ok to use JSON stringify here since Parts is ordered
    if (JSON.stringify(oldParts) === JSON.stringify(newParts)) {
        // same parts so no diff thus return empty diff
        return diff;
    }
    // if lengths of newParts and oldParts are different, then
    // the diff is all the new parts AND the new statics.  The reason is that
    // statics and dynamics part counts are dependent on each other.  if there are N
    // dynamics there are N+1 statics.
    let keyCountsDiffer = false;
    if (Object.keys(oldParts).length !== Object.keys(newParts).length) {
        // // different lengths so diff is all new parts. i.e. new statics and new dynamics
        // diff = structuredClone(newParts);
        // return diff;
        keyCountsDiffer = true;
    }
    // if JSON.strigifys are different then iterate through keys
    // TODO - should we check if key length is different?
    for (let i = 0; i < Object.keys(newParts).length; i++) {
        const key = Object.keys(newParts)[i];
        // the final message to client can also contain keys of 't' and 'e'
        // but these are added after the diff is calculated and represent
        // the title and event parts of the phx reply message.  they will not
        // be present in the Parts tree.
        if (key === "s") {
            // key of 's' should always be a statics array
            const oldStatics = oldParts[key];
            const newStatics = newParts[key];
            if (oldStatics.length !== newStatics.length) {
                // if length is different and if so keep new statics
                diff[key] = newStatics;
            }
            else if (keyCountsDiffer) {
                // if key counts are different for new and old parts keep the new statics
                diff[key] = newStatics;
                // } else if (diffArrays2<string>(oldStatics, newStatics).length > 0) {
            }
            else if (diffArrays(oldStatics, newStatics)) {
                // if length is the same but contents are different then keep new statics
                diff[key] = newStatics;
            }
        }
        else if (key === "d") {
            // key of 'd' should always be an array of Parts
            // TODO for elements of 'd' we should check if the parts are the same
            // if they are not the same for each element, we only send an array with the
            // changed elements.
            // const da = diffArrays2<Parts>(oldParts[key] as Array<Parts>, newParts[key] as Array<Parts>);
            // if (da.length > 0) {
            //   diff[key] = da;
            // }
            if (diffArrays(oldParts[key], newParts[key])) {
                diff[key] = newParts[key];
            }
        }
        else if (oldParts[key] !== undefined) {
            // if oldParts[key] is present it can only be a string or Parts object
            // check if string and diff it
            if (typeof newParts[key] === "string" && typeof oldParts[key] === "string") {
                if (newParts[key] !== oldParts[key]) {
                    diff[key] = newParts[key];
                }
            }
            // if both are numbers they are references to `LiveComponents`
            else if (typeof newParts[key] === "number" && typeof oldParts[key] === "number") {
                if (newParts[key] !== oldParts[key]) {
                    diff[key] = newParts[key];
                }
            }
            // since both aren't strings, check if they are Parts objects
            else if (typeof newParts[key] === "object" && typeof oldParts[key] === "object") {
                // check children for diffs
                const oldPart = oldParts[key];
                const newPart = newParts[key];
                // diff based on object type
                if (typeof newPart === "object" && typeof oldPart === "object") {
                    const maybeDiff = deepDiff(oldPart, newPart);
                    // keep if any keys are different
                    if (Object.keys(maybeDiff).length > 0) {
                        diff[key] = maybeDiff;
                    }
                }
            }
            // both aren't strings, Parts, or numbers so they must be different
            // types.  in that case, keep the newParts.
            else {
                diff[key] = newParts[key];
            }
        }
        else {
            // newParts has new key so add that diff
            diff[key] = newParts[key];
        }
    }
    return diff;
}
function diffArrays(oldArray, newArray) {
    if (oldArray.length !== newArray.length) {
        return true;
    }
    for (let i = 0; i < newArray.length; i++) {
        const newPart = newArray[i];
        const oldPart = oldArray[i];
        // parts are both strings
        if (typeof newPart === "string" && typeof oldPart === "string") {
            if (newPart !== oldPart) {
                return true;
            }
        }
        // parts are both objects (potentially arrays or not)
        else if (typeof newPart === "object" && typeof oldPart === "object") {
            // both parts are arrays
            if (Array.isArray(newPart) && Array.isArray(oldPart)) {
                if (diffArrays(oldPart, newPart)) {
                    return true;
                }
            }
            // both parts are objects
            else if (!Array.isArray(newPart) && !Array.isArray(oldPart)) {
                const maybeDiff = deepDiff(oldPart, newPart);
                // keep if any keys are different
                if (Object.keys(maybeDiff).length > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}
// Don't worry about test coverage for now since not used internally
// istanbul ignore next
function diffArrays2(oldArray, newArray) {
    const diffArray = [];
    // if newArray is shorter than oldArray, then we just use the newArray
    if (oldArray.length > newArray.length) {
        return newArray;
    }
    // if newArray is longer than oldArray or same lengh, then we iterate over newArray
    // and compare each element up to oldArray.length
    const lenghtDiff = newArray.length - oldArray.length;
    for (let i = 0; i < oldArray.length; i++) {
        const newPart = newArray[i];
        const oldPart = oldArray[i];
        // parts are both strings
        if (typeof newPart === "string" && typeof oldPart === "string") {
            if (newPart !== oldPart) {
                diffArray.push(newPart);
            }
        }
        // parts are both objects (potentially arrays or not)
        else if (typeof newPart === "object" && typeof oldPart === "object") {
            // both parts are arrays
            if (Array.isArray(newPart) && Array.isArray(oldPart)) {
                const res = diffArrays2(oldPart, newPart);
                if (res.length > 0) {
                    diffArray.push(...res);
                }
            }
            // both parts are Parts
            else if (!Array.isArray(newPart) && !Array.isArray(oldPart)) {
                const maybeDiff = deepDiff(oldPart, newPart);
                // keep if any keys are different
                if (Object.keys(maybeDiff).length > 0) {
                    diffArray.push(maybeDiff);
                }
            }
        }
    }
    if (lenghtDiff > 0) {
        diffArray.push(...newArray.slice(oldArray.length));
    }
    return diffArray;
}

// Initially copied from https://github.com/Janpot/escape-html-template-tag/blob/master/src/index.ts
// This is a modified version of escape-html-template-tag that builds a tree
// of statics and dynamics that can be used to render the template.
//
const ENTITIES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
};
const ENT_REGEX = new RegExp(Object.keys(ENTITIES).join("|"), "g");
function join(array, separator = "") {
    if (array.length <= 0) {
        return new HtmlSafeString([""], []);
    }
    return new HtmlSafeString(["", ...Array(array.length - 1).fill(separator), ""], array);
}
function safe(value) {
    if (value instanceof HtmlSafeString) {
        return value;
    }
    return new HtmlSafeString([String(value)], []);
}
function escapehtml(unsafe) {
    if (unsafe instanceof HtmlSafeString) {
        return unsafe.toString();
    }
    if (Array.isArray(unsafe)) {
        return join(unsafe, "").toString();
    }
    return String(unsafe).replace(ENT_REGEX, (char) => ENTITIES[char]);
}
class HtmlSafeString {
    statics;
    dynamics;
    isLiveComponent = false;
    // readonly children: readonly HtmlSafeString[]
    constructor(statics, dynamics, isLiveComponent = false) {
        this.statics = statics;
        this.dynamics = dynamics;
        this.isLiveComponent = isLiveComponent;
    }
    partsTree(includeStatics = true) {
        // statics.length should always equal dynamics.length + 1
        if (this.dynamics.length === 0) {
            if (this.statics.length !== 1) {
                throw new Error("Expected exactly one static string for HtmlSafeString" + this);
            }
            // TODO Optimization to just return the single static string?
            // if only statics, return just the statics
            // in fact, only statics / no dymaincs means we
            // can simplify this node and just return the only
            // static string since there can only be one static
            // return this.statics[0];
            return {
                s: this.statics,
            };
        }
        // otherwise walk the dynamics and build the parts tree
        const parts = this.dynamics.reduce((acc, cur, index) => {
            if (cur instanceof HtmlSafeString) {
                // handle isLiveComponent case
                if (cur.isLiveComponent) {
                    // for live components, we only send back a number which
                    // is the index of the component in the `c` key
                    // the `c` key is added to the parts tree by the
                    // ComponentManager when it renders the `LiveView`
                    return {
                        ...acc,
                        [`${index}`]: Number(cur.statics[0]),
                    };
                }
                else {
                    // this isn't a live component, so we need to contine walking
                    // the parts tree for this HtmlSafeString including to the children
                    // check if parts only has a single static string
                    // and if so make that the parts string instead of using
                    // the full parts tree
                    if (cur.statics.length === 1) {
                        return {
                            ...acc,
                            [`${index}`]: cur.statics[0],
                        };
                    }
                    // if not just a single static then we need to include the
                    // full parts tree
                    else {
                        return {
                            ...acc,
                            [`${index}`]: cur.partsTree(), // recurse to children
                        };
                    }
                }
            }
            else if (Array.isArray(cur)) {
                // if array is empty just return empty string
                if (cur.length === 0) {
                    return {
                        ...acc,
                        [`${index}`]: "",
                    };
                }
                // Not an empty array
                else {
                    // elements of Array are either: HtmlSafeString or Promise<HtmlSafeString>
                    let d;
                    let s;
                    // istanbul ignore next
                    if (cur[0] instanceof Promise) {
                        // istanbul ignore next
                        throw new Error("Promise not supported in HtmlSafeString, try using Promise.all to wait for all promises to resolve.");
                    }
                    else if (cur[0] instanceof HtmlSafeString) {
                        // if any of the children are live components, then we assume they all are
                        // and do not return the statics for this array
                        let isLiveComponentArray = false;
                        d = cur.map((c) => {
                            if (c.isLiveComponent) {
                                isLiveComponentArray = true;
                                return [Number(c.statics[0])];
                            }
                            else {
                                return Object.values(c.partsTree(false));
                            }
                        });
                        if (isLiveComponentArray) {
                            return {
                                ...acc,
                                [`${index}`]: { d },
                            };
                        }
                        // not an array of LiveComponents so return the statics too
                        s = cur.map((c) => c.statics)[0];
                        return {
                            ...acc,
                            [`${index}`]: { d, s },
                        };
                    }
                    else {
                        // istanbul ignore next
                        throw new Error("Expected HtmlSafeString or Promise<HtmlSafeString> but got:", cur[0].constructor.name);
                    }
                }
            }
            else {
                // cur is a literal string or number
                return {
                    ...acc,
                    [`${index}`]: escapehtml(String(cur)),
                };
            }
        }, {});
        // appends the statics to the parts tree
        if (includeStatics) {
            parts["s"] = this.statics;
        }
        return parts;
    }
    toString() {
        return this.statics.reduce((result, s, i) => {
            const d = this.dynamics[i - 1];
            return result + escapehtml(d) + s;
        });
    }
}
function html(statics, ...dynamics) {
    return new HtmlSafeString(statics, dynamics);
}

const form_for = (action, csrfToken, options) => {
    const method = options?.method ?? "post";
    const phx_submit = options?.phx_submit ? safe(` phx-submit="${options.phx_submit}"`) : "";
    const phx_change = options?.phx_change ? safe(` phx-change="${options.phx_change}"`) : "";
    const id = options?.id ? safe(` id="${options.id}"`) : "";
    // prettier-ignore
    return html `
    <form${id} action="${action}" method="${method}"${phx_submit}${phx_change}>
      <input type="hidden" name="_csrf_token" value="${csrfToken}" />
  `;
};

const text_input = (changeset, key, options) => {
    const placeholder = options?.placeholder ? safe(` placeholder="${options.placeholder}"`) : "";
    const autocomplete = options?.autocomplete ? safe(` autocomplete="${options.autocomplete}"`) : "";
    const phx_debounce = options?.phx_debounce ? safe(` phx-debounce="${options.phx_debounce}"`) : "";
    const className = options?.className ? safe(` class="${options.className}"`) : "";
    const type = options?.type ?? "text";
    const id = `input_${key}`;
    const value = changeset.data[key] ?? "";
    // prettier-ignore
    return html `<input type="${type}" id="${id}" name="${String(key)}" value="${value}"${className}${autocomplete}${placeholder}${phx_debounce}/>`;
};
const telephone_input = (changeset, key, options) => {
    return text_input(changeset, key, { ...options, type: "tel" });
};
const error_tag = (changeset, key, options) => {
    const error = changeset.errors ? changeset.errors[key] : undefined;
    if (!changeset.valid && error) {
        const className = options?.className ?? "invalid-feedback";
        return html `<span class="${className}" phx-feedback-for="${key}">${error}</span>`;
    }
    return html ``;
};

function buildHref(options) {
    const { path, params } = options.to;
    const urlParams = new URLSearchParams(params);
    if (urlParams.toString().length > 0) {
        return `${path}?${urlParams.toString()}`;
    }
    else {
        return path;
    }
}
const live_patch = (anchorBody, options) => {
    // prettier-ignore
    return html `<a data-phx-link="patch" data-phx-link-state="push" href="${safe(buildHref(options))}"${options.className ? safe(` class="${options.className}"`) : ""}>${anchorBody}</a>`;
};

const live_title_tag = (title, options) => {
    const { prefix, suffix } = options ?? {};
    const prefix_data = prefix ? safe(` data-prefix="${prefix}"`) : "";
    const suffix_data = suffix ? safe(` data-suffix="${suffix}"`) : "";
    return html `<title${prefix_data}${suffix_data}>${prefix ?? ""}${title}${suffix ?? ""}</title>`;
};

const options_for_select = (options, selected) => {
    // string[] options
    if (typeof options === "object" && Array.isArray(options)) {
        const htmlOptions = mapArrayOptions(options, selected);
        return renderOptions(htmlOptions);
    }
    // Record<string, string> options
    else {
        const htmlOptions = mapRecordOptions(options, selected);
        return renderOptions(htmlOptions);
    }
};
function mapArrayOptions(options, selected) {
    return options.map((option) => {
        return {
            label: option,
            value: option,
            selected: selected ? isSelected(option, selected) : false,
        };
    });
}
function mapRecordOptions(options, selected) {
    return Object.entries(options).map(([label, value]) => {
        return {
            label,
            value,
            selected: selected ? isSelected(value, selected) : false,
        };
    });
}
function isSelected(value, selected) {
    if (Array.isArray(selected)) {
        return selected.includes(value);
    }
    return value === selected;
}
function renderOptions(options) {
    return join(options.map(renderOption));
}
function renderOption(option) {
    // prettier-ignore
    return html `<option value="${option.value}"${option.selected ? " selected" : ""}>${option.label}</option>`;
}

const submit = (label, options) => {
    const phx_disable_with = options?.phx_disable_with ? safe(` phx-disable-with="${options.phx_disable_with}"`) : "";
    // prettier-ignore
    return html `<button type="submit"${phx_disable_with}>${label}</button>`;
};

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
const handleHttpLiveView = async (idGenerator, csrfGenerator, liveView, adaptor, pageRenderer, pageTitleDefaults, rootRenderer) => {
    const { getSessionData, getRequestUrl, onRedirect } = adaptor;
    // new LiveViewId for each request
    const liveViewId = idGenerator();
    // extract csrf token from session data or generate it if it doesn't exist
    const sessionData = getSessionData();
    if (sessionData._csrf_token === undefined) {
        sessionData._csrf_token = csrfGenerator();
    }
    // prepare a http socket for the `LiveView` render lifecycle: mount => handleParams => render
    const liveViewSocket = new HttpLiveViewSocket(liveViewId);
    // execute the `LiveView`'s `mount` function, passing in the data from the HTTP request
    await liveView.mount(liveViewSocket, { ...sessionData }, { _csrf_token: sessionData._csrf_token, _mounts: -1 });
    // check for redirects in `mount`
    if (liveViewSocket.redirect) {
        const { to } = liveViewSocket.redirect;
        onRedirect(to);
        return;
    }
    // execute the `LiveView`'s `handleParams` function, passing in the data from the HTTP request
    const url = getRequestUrl();
    await liveView.handleParams(url, liveViewSocket);
    // check for redirects in `handleParams`
    if (liveViewSocket.redirect) {
        const { to } = liveViewSocket.redirect;
        onRedirect(to);
        return;
    }
    // now render the `LiveView` including running the lifecycle of any `LiveComponent`s it contains
    let myself = 1; // counter for live_component calls
    const view = await liveView.render(liveViewSocket.context, {
        csrfToken: sessionData.csrfToken,
        async live_component(liveComponent, params) {
            // params may be empty if the `LiveComponent` doesn't have any params
            params = params ?? {};
            delete params.id; // remove id before passing to socket
            // prepare a http socket for the `LiveComponent` render lifecycle: mount => update => render
            const lcSocket = new HttpLiveComponentSocket(liveViewId, params);
            // pass params provided in `LiveView.render` to the `LiveComponent` socket
            lcSocket.assign(params);
            // start the `LiveComponent` lifecycle
            await liveComponent.mount(lcSocket);
            await liveComponent.update(lcSocket);
            // render view with context
            const newView = await liveComponent.render(lcSocket.context, { myself: myself });
            myself++;
            // return the view to the parent `LiveView` to be rendered
            return newView;
        },
        url,
    });
    // now that we've rendered the `LiveView` and its `LiveComponent`s, we can serialize the session data
    // to be passed into the websocket connection
    const serDe = adaptor.getSerDe();
    const serializedSession = await serDe.serialize({ ...sessionData });
    // TODO implement tracking of statics
    // const serializedStatics = serDe.serialize({ ...view.statics });
    const serializedStatics = "";
    // optionally render the `LiveView` inside another template passing the session data
    // and the rendered `LiveView` to the template renderer
    let liveViewContent = safe(view);
    if (rootRenderer) {
        liveViewContent = await rootRenderer({ ...sessionData }, safe(view));
    }
    // wrap `LiveView` content inside the `phx-main` template along with the serialized
    // session data and the generated live view ID for the websocket connection
    const rootContent = html `
    <div
      data-phx-main="true"
      data-phx-session="${serializedSession}"
      data-phx-static="${serializedStatics}"
      id="phx-${liveViewId}">
      ${safe(liveViewContent)}
    </div>
  `;
    // finally render the `LiveView` root template passing any pageTitle data, the CSRF token,  and the rendered `LiveView`
    const rootView = await pageRenderer(pageTitleDefaults ?? { title: "" }, sessionData._csrf_token, rootContent);
    return rootView.toString();
};

/**
 * Naive implementation of flash adaptor that uses "__flash" property on session data
 * to implement flash.
 */
class SessionFlashAdaptor {
    peekFlash(session, key) {
        if (!session.__flash) {
            // istanbul ignore next
            session.__flash = {};
        }
        return Promise.resolve(session.__flash[key]);
    }
    popFlash(session, key) {
        if (!session.__flash) {
            // istanbul ignore next
            session.__flash = {};
        }
        const value = session.__flash[key];
        delete session.__flash[key];
        return Promise.resolve(value);
    }
    putFlash(session, key, value) {
        if (!session.__flash) {
            // istanbul ignore next
            session.__flash = {};
        }
        session.__flash[key] = value;
        return Promise.resolve();
    }
    clearFlash(session, key) {
        if (!session.__flash) {
            // istanbul ignore next
            session.__flash = {};
        }
        delete session.__flash[key];
        return Promise.resolve();
    }
}

const isDate = d => d instanceof Date;
const isEmpty = o => Object.keys(o).length === 0;
const isObject = o => o != null && typeof o === 'object';
const hasOwnProperty = (o, ...args) => Object.prototype.hasOwnProperty.call(o, ...args);
const isEmptyObject = (o) => isObject(o) && isEmpty(o);

const updatedDiff = (lhs, rhs) => {
  if (lhs === rhs) return {};

  if (!isObject(lhs) || !isObject(rhs)) return rhs;

  const l = lhs;
  const r = rhs;

  if (isDate(l) || isDate(r)) {
    if (l.valueOf() == r.valueOf()) return {};
    return r;
  }

  return Object.keys(r).reduce((acc, key) => {
    if (hasOwnProperty(l, key)) {
      const difference = updatedDiff(l[key], r[key]);

      // If the difference is empty, and the lhs is an empty object or the rhs is not an empty object
      if (isEmptyObject(difference) && !isDate(difference) && (isEmptyObject(l[key]) || !isEmptyObject(r[key])))
        return acc; // return no diff

      acc[key] = difference;
      return acc;
    }

    return acc;
  }, {});
};

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
const newChangesetFactory = (schema) => {
    return (existing, newAttrs, action) => {
        const merged = { ...existing, ...newAttrs };
        const result = schema.safeParse(merged);
        let errors;
        if (result.success === false) {
            errors = result.error.issues.reduce((acc, issue) => {
                // @ts-ignore
                acc[issue.path[0]] = issue.message;
                return acc;
            }, {});
        }
        return {
            action,
            changes: updatedDiff(existing, merged),
            data: result.success ? result.data : merged,
            valid: action !== undefined ? result.success : true,
            errors,
        };
    };
};

/**
 * A PubSub implementation that uses the Node.js EventEmitter as a backend.
 *
 * Should only be used in single process environments like local development
 * or a single instance.  In a multi-process environment, use RedisPubSub.
 */
const eventEmitter = new EventEmitter(); // use this singleton for all pubSub events
class SingleProcessPubSub {
    subscribers = {};
    async subscribe(topic, subscriber) {
        await eventEmitter.addListener(topic, subscriber);
        // store connection id for unsubscribe and return for caller
        const subId = crypto.randomBytes(10).toString("hex");
        this.subscribers[subId] = subscriber;
        return subId;
    }
    async broadcast(topic, data) {
        await eventEmitter.emit(topic, data);
    }
    async unsubscribe(topic, subscriberId) {
        // get subscriber function from id
        const subscriber = this.subscribers[subscriberId];
        await eventEmitter.removeListener(topic, subscriber);
        // remove subscriber from subscribers
        delete this.subscribers[subscriberId];
    }
}

var PhxProtocol;
(function (PhxProtocol) {
    PhxProtocol[PhxProtocol["joinRef"] = 0] = "joinRef";
    PhxProtocol[PhxProtocol["messageRef"] = 1] = "messageRef";
    PhxProtocol[PhxProtocol["topic"] = 2] = "topic";
    PhxProtocol[PhxProtocol["event"] = 3] = "event";
    PhxProtocol[PhxProtocol["payload"] = 4] = "payload";
})(PhxProtocol || (PhxProtocol = {}));

const newPhxReply = (from, payload) => {
    const [joinRef, messageRef, topic, ...rest] = from;
    return [joinRef, messageRef, topic, "phx_reply", payload];
};
const newHeartbeatReply = (incoming) => {
    return [
        null,
        incoming[PhxProtocol.messageRef],
        "phoenix",
        "phx_reply",
        {
            response: {},
            status: "ok",
        },
    ];
};

/**
 * The `LiveViewComponentManager` is responsible for managing the lifecycle of a `LiveViewComponent`
 * including routing of events, the state (i.e. context), and other aspects of the component.  The
 * `MessageRouter` is responsible for routing messages to the appropriate `LiveViewComponentManager`
 * based on the topic on the incoming socket messages.
 */
class LiveViewManager {
    connectionId;
    joinId;
    url;
    wsAdaptor;
    subscriptionIds = {};
    liveView;
    intervals = [];
    session;
    pubSub;
    serDe;
    flashAdaptor;
    csrfToken;
    _infoQueue = [];
    _events = [];
    _pageTitle;
    pageTitleChanged = false;
    socket;
    liveViewRootTemplate;
    hasWarnedAboutMissingCsrfToken = false;
    _parts;
    _cidIndex = 0;
    constructor(liveView, connectionId, wsAdaptor, serDe, pubSub, flashAdaptor, liveViewRootTemplate) {
        this.liveView = liveView;
        this.connectionId = connectionId;
        this.wsAdaptor = wsAdaptor;
        this.serDe = serDe;
        this.pubSub = pubSub;
        this.flashAdaptor = flashAdaptor;
        this.liveViewRootTemplate = liveViewRootTemplate;
        // subscribe to events for a given connectionId which should only be heartbeat messages
        const subId = this.pubSub.subscribe(connectionId, this.handleSubscriptions.bind(this));
        // save subscription id for unsubscribing on shutdown
        this.subscriptionIds[connectionId] = subId;
    }
    /**
     * The `phx_join` event is the initial connection between the client and the server and initializes the
     * `LiveView`, sets up subscriptions for additional events, and otherwise prepares the `LiveView` for
     * future client interactions.
     * @param message a `PhxJoinIncoming` message
     */
    async handleJoin(message) {
        try {
            const payload = message[PhxProtocol.payload];
            const topic = message[PhxProtocol.topic];
            // figure out if we are using url or redirect for join URL
            const { url: urlString, redirect: redirectString } = payload;
            if (urlString === undefined && redirectString === undefined) {
                throw new Error("Join message must have either a url or redirect property");
            }
            // checked one of these was defined in MessageRouter
            const url = new URL((urlString || redirectString));
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
            const subId = this.pubSub.subscribe(this.joinId, this.handleSubscriptions.bind(this));
            // again save subscription id for unsubscribing
            this.subscriptionIds[this.joinId] = subId;
            // run initial lifecycle steps for the liveview: mount => handleParams
            this.socket = this.newLiveViewSocket();
            await this.liveView.mount(this.socket, this.session, payloadParams);
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
        }
        catch (e) {
            console.error("Error handling join", e);
        }
    }
    /**
     * Every event other than `phx_join` that is received over the connected WebSocket are passed into this
     * method and then dispatched the appropriate handler based on the message type.
     * @param phxMessage
     */
    async handleSubscriptions(phxMessage) {
        // console.log("handleSubscriptions", this.connectionId, this.joinId, phxMessage.type);
        try {
            const { type } = phxMessage;
            switch (type) {
                case "heartbeat":
                    this.onHeartbeat(phxMessage.message);
                    break;
                case "event":
                    await this.onEvent(phxMessage.message);
                    break;
                case "live_patch":
                    await this.onLivePatch(phxMessage.message);
                    break;
                case "phx_leave":
                    await this.onPhxLeave(phxMessage.message);
                    break;
                default:
                    console.error(`Unknown message type:"${type}", message:"${JSON.stringify(phxMessage)}" on connectionId:"${this.connectionId}" and joinId:"${this.joinId}"`);
            }
        }
        catch (e) {
            /* istanbul ignore next */
            console.error("Error handling subscription", e);
        }
    }
    /**
     * Any message of type `event` is passed into this method and then handled based on the payload details of
     * the message including: click, form, key, blur/focus, and hook events.
     * @param message a `PhxEventIncoming` message with a different payload depending on the event type
     */
    async onEvent(message) {
        try {
            const payload = message[PhxProtocol.payload];
            const { type, event, cid } = payload;
            // TODO - handle uploads
            let value = {};
            switch (type) {
                case "click":
                    // check if the click is a lv:clear-flash event
                    if (event === "lv:clear-flash") {
                        const clearFlashPayload = payload;
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
                            console.error(`Rejecting form submission due to mismatched csrfTokens. expected:"${this.csrfToken}", got:"${value._csrf_token}"`);
                            return;
                        }
                    }
                    else {
                        if (!this.hasWarnedAboutMissingCsrfToken) {
                            console.warn(`Warning: form event data missing _csrf_token value. \nConsider passing it in via a hidden input named "_csrf_token".  \nYou can get the value from the LiveViewMeta object passed the render method. \nWe won't warn you again for this instance of the LiveView.`);
                            this.hasWarnedAboutMissingCsrfToken = true;
                        }
                    }
                    // TODO - check for _target variable from phx_change here and remove it from value?
                    break;
                default:
                    console.error("Unknown event type", type);
                    return;
            }
            // package the event into a `LiveEvent` type
            const eventObj = {
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
                        const lcSocket = this.newLiveComponentSocket(structuredClone(oldContext));
                        // check for handleEvent and call it if it exists
                        if (!liveComponent.handleEvent) {
                            // istanbul ignore next
                            console.error(`LiveComponent ${componentClass} with id ${cid} has not implemented handleEvent() method`);
                        }
                        else {
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
                        let diff = {
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
                    }
                    else {
                        // not sure how we'd get here but just in case - ignore test coverage though
                        /* istanbul ignore next */
                        console.error("Could not find stateful component instance for", componentClass);
                        /* istanbul ignore next */
                        return;
                    }
                }
                else {
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
                }
                else {
                    // ensure re-render happends even if context doesn't change
                    forceRerender = true;
                }
                // skip ctxEqual for now
                // const ctxEqual = areConte xtsValueEqual(previousContext, this.socket.context);
                let diff = {};
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
                diff = deepDiff(this._parts, newParts);
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
        }
        catch (e) {
            /* istanbul ignore next */
            console.error("Error handling event", e);
        }
    }
    /**
     * Handle's `live_patch` message from clients which denote change to the `LiveView`'s path parameters
     * and kicks off a re-render after calling `handleParams`.
     * @param message a `PhxLivePatchIncoming` message
     */
    async onLivePatch(message) {
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
            let diff = deepDiff(this._parts, newParts);
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
        }
        catch (e) {
            /* istanbul ignore next */
            console.error("Error handling live_patch", e);
        }
    }
    /**
     * Responds to `heartbeat` message from clients by sending a `heartbeat` message back.
     * @param message
     */
    onHeartbeat(message) {
        // TODO - monitor lastHeartbeat and shutdown if it's been too long?
        this.sendPhxReply(newHeartbeatReply(message));
    }
    /**
     * Handles `phx_leave` messages from clients which are sent when the client is leaves the `LiveView`
     * that is currently being rendered by navigating to a different `LiveView` or closing the browser.
     * @param message
     */
    async onPhxLeave(message) {
        await this.shutdown();
    }
    /**
     * Clean up any resources used by the `LiveView` and `LiveComponent` instances.
     */
    async shutdown() {
        try {
            // unsubscribe from PubSubs
            Object.entries(this.subscriptionIds).forEach(async ([topic, subscriptionId]) => {
                const subId = await subscriptionId;
                await this.pubSub.unsubscribe(topic, subId);
            });
            // clear intervals
            this.intervals.forEach(clearInterval);
        }
        catch (e) {
            // ignore errors
        }
    }
    /**
     * Repeats a function every `intervalMillis` milliseconds until `shutdown` is called.
     * @param fn
     * @param intervalMillis
     */
    repeat(fn, intervalMillis) {
        // wrap function in another function that sends any send infos
        // TODO prob a race condition here but not sure what can really do about it
        const fnPlusSendInfo = () => {
            fn();
            this.maybeSendInfos();
        };
        this.intervals.push(setInterval(fnPlusSendInfo, intervalMillis));
    }
    /**
     * Callback from `LiveSocket`s passed into `LiveView` and `LiveComponent` lifecycle methods (i.e. mount, handleParams,
     * handleEvent, handleInfo, update, etc) that enables a `LiveView` or `LiveComponent` to update the browser's
     * path and query string params.
     * @param path the path to patch
     * @param params the URLSearchParams to that will drive the new path query string params
     * @param replaceHistory whether to replace the current browser history entry or not
     */
    async onPushPatch(path, params, replaceHistory = false) {
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
    async onPushRedirect(path, params, replaceHistory = false) {
        this.onPushNavigation("live_redirect", path, params, replaceHistory);
    }
    /**
     * Common logic that handles both `live_patch` and `live_redirect` messages from clients.
     * @param navEvent the type of navigation event to handle: either `live_patch` or `live_redirect`
     * @param path the path to patch or to be redirected to
     * @param params the URLSearchParams to that will be added to the path
     * @param replaceHistory whether to replace the current browser history entry or not
     */
    async onPushNavigation(navEvent, path, params, replaceHistory = false) {
        try {
            // construct the outgoing message
            const to = params ? `${path}?${params}` : path;
            const kind = replaceHistory ? "replace" : "push";
            const message = [
                null,
                null,
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
        }
        catch (e) {
            /* istanbul ignore next */
            console.error(`Error handling ${navEvent}`, e);
        }
    }
    /**
     * Queues `AnyLivePushEvent` messages to be sent to the client on the subsequent `sendPhxReply` call.
     * @param pushEvent the `AnyLivePushEvent` to queue
     */
    onPushEvent(pushEvent) {
        // queue event
        this._events.push(pushEvent);
    }
    /**
     * Queues `AnyLiveInfo` messages to be sent to the LiveView until after the current lifecycle
     * @param info the AnyLiveInfo to queue
     */
    onSendInfo(info) {
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
    async sendInternal(info) {
        try {
            this.liveView.handleInfo(info, this.socket);
            // render the new view
            let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());
            // wrap in root template if there is one
            view = await this.maybeWrapInRootTemplate(view);
            // diff the render trees and save the new parts
            const newParts = view.partsTree(true);
            let diff = deepDiff(this._parts, newParts);
            this._parts = newParts;
            diff = this.maybeAddPageTitleToParts(diff);
            diff = this.maybeAddEventsToParts(diff);
            const reply = [
                null,
                null,
                this.joinId,
                "diff",
                diff,
            ];
            this.sendPhxReply(reply);
            // remove temp data
            this.socket.updateContextWithTempAssigns();
        }
        catch (e) {
            /* istanbul ignore next */
            console.error(`Error sending internal info`, e);
        }
    }
    set pageTitle(newTitle) {
        if (this._pageTitle !== newTitle) {
            this._pageTitle = newTitle;
            this.pageTitleChanged = true;
        }
    }
    async putFlash(key, value) {
        try {
            await this.flashAdaptor.putFlash(this.session, key, value);
        }
        catch (e) {
            /* istanbul ignore next */
            console.error(`Error putting flash`, e);
        }
    }
    clearFlash(key) {
        try {
            this.flashAdaptor.clearFlash(this.session, key);
        }
        catch (e) {
            /* istanbul ignore next */
            console.error(`Error clearing flash`, e);
        }
    }
    async maybeSendInfos() {
        if (this._infoQueue.length > 0) {
            const infos = this._infoQueue.splice(0, this._infoQueue.length);
            for (const info of infos) {
                await this.sendInternal(info);
            }
        }
    }
    async maybeWrapInRootTemplate(view) {
        if (this.liveViewRootTemplate) {
            return await this.liveViewRootTemplate(this.session, safe(view));
        }
        return view;
    }
    maybeAddPageTitleToParts(parts) {
        if (this.pageTitleChanged) {
            this.pageTitleChanged = false; // reset
            return {
                ...parts,
                t: this._pageTitle,
            };
        }
        return parts;
    }
    maybeAddEventsToParts(parts) {
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
    sendPhxReply(reply) {
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
    statefulLiveComponents = {};
    statefuleLiveComponentInstances = {};
    /**
     * Collect all the LiveComponents first, group by their component type (e.g. instanceof),
     * then run single preload for all components of same type. then run rest of lifecycle
     * based on stateless or stateful.
     * @param liveComponent
     * @param params
     */
    async liveComponentProcessor(liveComponent, params = {}) {
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
            this.statefuleLiveComponentInstances[componentClass] = liveComponent;
        }
        // setup variables
        let context = structuredClone(params);
        let newView;
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
            let myself;
            if (this.statefulLiveComponents[compoundId] === undefined) {
                myself = ++this._cidIndex; // get next cid
                // setup socket
                const lcSocket = this.newLiveComponentSocket(structuredClone(context));
                // first load lifecycle mount => update => render
                await liveComponent.mount(lcSocket);
                await liveComponent.update(lcSocket);
                newView = await liveComponent.render(lcSocket.context, { myself });
                console.dir(newView);
                // store state for subsequent loads
                this.statefulLiveComponents[compoundId] = {
                    context: lcSocket.context,
                    parts: newView.partsTree(),
                    changed: true,
                    cid: myself,
                    componentClass,
                    compoundId,
                };
            }
            else {
                // subsequent loads lifecycle update => render
                // get state for this load
                const liveComponentData = this.statefulLiveComponents[compoundId];
                const { context: oldContext, parts: oldParts, cid } = liveComponentData;
                myself = cid;
                // setup socket
                const lcSocket = this.newLiveComponentSocket(structuredClone(oldContext));
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
        }
        else {
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
            const lcSocket = this.newLiveComponentSocket(structuredClone(context));
            // skipping preload for now... see comment above
            // first load lifecycle mount => update => render
            await liveComponent.mount(lcSocket);
            await liveComponent.update(lcSocket);
            newView = await liveComponent.render(lcSocket.context, { myself: id });
            // since this is stateless send back the LiveViewTemplate
            return newView;
        }
    }
    maybeAddLiveComponentsToParts(parts) {
        const changedParts = {};
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
    defaultLiveViewMeta() {
        return {
            csrfToken: this.csrfToken,
            live_component: async (liveComponent, params) => {
                return await this.liveComponentProcessor(liveComponent, params);
            },
            url: this.url,
        };
    }
    newLiveViewSocket() {
        return new WsLiveViewSocket(this.joinId, (newTitle) => {
            this.pageTitle = newTitle;
        }, (event) => this.onPushEvent(event), async (path, params, replace) => await this.onPushPatch(path, params, replace), async (path, params, replace) => await this.onPushRedirect(path, params, replace), async (key, value) => await this.putFlash(key, value), (fn, intervalMillis) => this.repeat(fn, intervalMillis), (info) => this.onSendInfo(info), async (topic) => {
            const subId = this.pubSub.subscribe(topic, (info) => {
                this.sendInternal(info);
            });
            this.subscriptionIds[topic] = subId;
        });
    }
    newLiveComponentSocket(context) {
        return new WsLiveComponentSocket(this.joinId, context, (info) => this.onSendInfo(info), (event) => this.onPushEvent(event));
    }
}

/**
 * LiveViewJS Router for web socket messages.  Determines if a message is a `LiveView` message and routes it
 * to the correct LiveView based on the meta data.
 */
class WsMessageRouter {
    router;
    pubSub;
    flashAdaptor;
    serDe;
    liveViewRootTemplate;
    constructor(router, pubSub, flashAdaptor, serDe, liveViewRootTemplate) {
        this.router = router;
        this.pubSub = pubSub;
        this.flashAdaptor = flashAdaptor;
        this.serDe = serDe;
        this.liveViewRootTemplate = liveViewRootTemplate;
    }
    async onMessage(connectionId, messageString, wsAdaptor) {
        // parse string to JSON
        const rawPhxMessage = JSON.parse(messageString);
        // rawPhxMessage must be an array with 5 elements
        if (typeof rawPhxMessage === "object" && Array.isArray(rawPhxMessage) && rawPhxMessage.length === 5) {
            const event = rawPhxMessage[PhxProtocol.event];
            const topic = rawPhxMessage[PhxProtocol.topic];
            try {
                switch (event) {
                    case "phx_join":
                        // handle phx_join seperate from other events so we can create a new
                        // component manager and send the join message to it
                        await this.onPhxJoin(connectionId, rawPhxMessage, wsAdaptor);
                        break;
                    case "heartbeat":
                        // send heartbeat to component manager via connectionId broadcast
                        await this.pubSub.broadcast(connectionId, {
                            type: event,
                            message: rawPhxMessage,
                        });
                        break;
                    case "event":
                    case "live_patch":
                    case "phx_leave":
                        // other events we can send via topic broadcast
                        await this.pubSub.broadcast(topic, { type: event, message: rawPhxMessage });
                        break;
                    default:
                        throw new Error(`unexpected protocol event ${rawPhxMessage}`);
                }
            }
            catch (e) {
                console.error(`error handling phx message ${rawPhxMessage}`, e);
            }
        }
        else {
            console.error(`error unknown message type for connectionId "${connectionId}". `, rawPhxMessage);
        }
    }
    async onClose(connectionId) {
        // when client closes connection send phx_leave message
        // to component manager via connectionId broadcast
        await this.pubSub.broadcast(connectionId, {
            type: "phx_leave",
            message: [null, null, "phoenix", "phx_leave", {}],
        });
    }
    async onPhxJoin(connectionId, message, wsAdaptor) {
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
        const liveViewManager = new LiveViewManager(component, connectionId, wsAdaptor, this.serDe, this.pubSub, this.flashAdaptor, this.liveViewRootTemplate);
        await liveViewManager.handleJoin(message);
    }
}

export { BaseLiveComponent, BaseLiveView, HtmlSafeString, HttpLiveComponentSocket, HttpLiveViewSocket, LiveViewManager, SessionFlashAdaptor, SingleProcessPubSub, WsLiveComponentSocket, WsLiveViewSocket, WsMessageRouter, createLiveComponent, createLiveView, deepDiff, diffArrays, diffArrays2, error_tag, escapehtml, form_for, handleHttpLiveView, html, join, live_patch, live_title_tag, newChangesetFactory, options_for_select, safe, submit, telephone_input, text_input };
