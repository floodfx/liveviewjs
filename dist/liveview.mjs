
/// <reference types="./liveview.d.ts" />
import crypto from 'crypto';
import EventEmitter from 'events';

class BaseLiveView {
    mount(params, session, socket) {
        // no-op
    }
    handleParams(params, url, socket) {
        // no-op
    }
}

class BaseLiveComponentSocket {
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
    send(event) {
        // no-op
    }
    pushEvent(event, params) {
        // no-op
    }
}
class HttpLiveComponentSocket extends BaseLiveComponentSocket {
    constructor(id, context) {
        super(id, context);
        this.connected = false;
    }
}
class WsLiveComponentSocket extends BaseLiveComponentSocket {
    constructor(id, context, sendCallback, pushEventCallback) {
        super(id, context);
        this.connected = true;
        this.sendCallback = sendCallback;
        this.pushEventCallback = pushEventCallback;
    }
    send(event) {
        this.sendCallback(event);
    }
    pushEvent(event, params) {
        this.pushEventCallback(event, params);
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
    handleEvent(event, params, socket) {
        // no-op
    }
}

class WsLiveViewMeta {
    constructor(liveViewId, csrfToken) {
        this.myself = 0;
        this.csrfToken = csrfToken;
        this.liveViewId = liveViewId;
    }
    async live_component(liveComponent, params) {
        // params may be empty
        params = params !== null && params !== void 0 ? params : {};
        delete params.id; // remove id before passing to socket
        // create live component socket
        const lcSocket = new HttpLiveComponentSocket(this.liveViewId, params);
        // update socket with params
        lcSocket.assign(params);
        // run lifecycle
        await liveComponent.mount(lcSocket);
        await liveComponent.update(lcSocket);
        // render view with context
        const lcContext = lcSocket.context;
        const newView = await liveComponent.render(lcContext, { myself: this.myself });
        this.myself++;
        // since http request is stateless send back the LiveViewTemplate
        return newView;
    }
}

class BaseLiveViewSocket {
    constructor() {
        this._tempContext = {}; // values to reset the context to post render cycle
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
    tempAssign(tempContext) {
        this._tempContext = {
            ...this._tempContext,
            ...tempContext,
        };
    }
    pageTitle(newPageTitle) {
        // no-op
    }
    pushEvent(event, params) {
        // no-op
    }
    pushPatch(path, params, replaceHistory) {
        // no-op
    }
    pushRedirect(path, params, replaceHistory) {
        // no-op
    }
    putFlash(key, value) {
        // no-op
    }
    repeat(fn, intervalMillis) {
        // no-op
    }
    send(event) {
        // no-op
    }
    subscribe(topic) {
        // no-op
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
    constructor(id) {
        super();
        this.connected = false;
        this.id = id;
    }
    get redirect() {
        return this._redirect;
    }
    pushRedirect(path, params, replaceHistory) {
        let stringParams;
        const urlParams = new URLSearchParams();
        if (params && Object.keys(params).length > 0) {
            for (const [key, value] of Object.entries(params)) {
                urlParams.set(key, String(value));
            }
            stringParams = urlParams.toString();
        }
        const to = stringParams ? `${path}?${stringParams}` : path;
        this._redirect = {
            to,
            replace: replaceHistory || false,
        };
    }
}
/**
 * Full inmplementation used once a `LiveView` is mounted to a websocket.
 */
class WsLiveViewSocket extends BaseLiveViewSocket {
    constructor(id, pageTitleCallback, pushEventCallback, pushPatchCallback, pushRedirectCallback, putFlashCallback, repeatCallback, sendCallback, subscribeCallback) {
        super();
        this.connected = true;
        this.id = id;
        this.pageTitleCallback = pageTitleCallback;
        this.pushEventCallback = pushEventCallback;
        this.pushPatchCallback = pushPatchCallback;
        this.pushRedirectCallback = pushRedirectCallback;
        this.putFlashCallback = putFlashCallback;
        this.repeatCallback = repeatCallback;
        this.sendCallback = sendCallback;
        this.subscribeCallback = subscribeCallback;
    }
    putFlash(key, value) {
        this.putFlashCallback(key, value);
    }
    pageTitle(newPageTitle) {
        this.pageTitleCallback(newPageTitle);
    }
    pushEvent(event, params) {
        this.pushEventCallback(event, params);
    }
    pushPatch(path, params, replaceHistory = false) {
        this.pushPatchCallback(path, params, replaceHistory);
    }
    pushRedirect(path, params, replaceHistory = false) {
        this.pushRedirectCallback(path, params, replaceHistory);
    }
    repeat(fn, intervalMillis) {
        this.repeatCallback(fn, intervalMillis);
    }
    send(event) {
        this.sendCallback(event);
    }
    subscribe(topic) {
        this.subscribeCallback(topic);
    }
}

// returns a Parts tree that only contains the differences between
// the oldParts tree and the newParts tree
function deepDiff(oldParts, newParts) {
    let diff = {};
    // ok to use JSON stringify here since Parts is ordered
    if (JSON.stringify(oldParts) === JSON.stringify(newParts)) {
        // same parts so no diff
        return diff;
    }
    // if JSON.strigifys are different then iterate through keys
    for (let i = 0; i < Object.keys(newParts).length; i++) {
        const key = Object.keys(newParts)[i];
        // if key is 's' should always be a statics array
        // if key is 'd' should always be an array of Parts[]
        if (key === "s" || key === "d") {
            if (diffArrays(oldParts[key], newParts[key])) {
                diff[key] = newParts[key];
            }
        }
        // if oldParts[key] is present is can only be a string or Parts object
        else if (oldParts[key]) {
            // check if string and diff it
            if (typeof newParts[key] === "string" && typeof oldParts[key] === "string") {
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
            // both aren't strings or Parts so they must be different
            // types.  in that case, keep the newParts.
            else {
                diff[key] = newParts[key];
            }
        }
        // newParts has new key so add keep that
        else {
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
    // readonly children: readonly HtmlSafeString[]
    constructor(statics, dynamics, isLiveComponent = false) {
        this.isLiveComponent = false;
        this.statics = statics;
        this._dynamics = dynamics;
        this.isLiveComponent = isLiveComponent;
    }
    partsTree(includeStatics = true) {
        // statics.length should always equal dynamics.length + 1
        if (this._dynamics.length === 0) {
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
        const parts = this._dynamics.reduce((acc, cur, index) => {
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
                    // the tree including to the children
                    return {
                        ...acc,
                        [`${index}`]: cur.partsTree(), // recurse to children
                    };
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
                // not an empty array but array of HtmlSafeString
                else {
                    const currentPart = cur;
                    // collect all the dynamic partsTrees
                    const d = currentPart.map((c) => Object.values(c.partsTree(false)));
                    // we know the statics are the same for all the children
                    // so we can just take the first one
                    const s = currentPart.map((c) => c.statics)[0];
                    return {
                        ...acc,
                        [`${index}`]: { d, s },
                    };
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
            const d = this._dynamics[i - 1];
            return result + escapehtml(d) + s;
        });
    }
}
function html(statics, ...dynamics) {
    return new HtmlSafeString(statics, dynamics);
}

// TODO insert hidden input for CSRF token?
const form_for = (action, options) => {
    var _a;
    const method = (_a = options === null || options === void 0 ? void 0 : options.method) !== null && _a !== void 0 ? _a : "post";
    const phx_submit = (options === null || options === void 0 ? void 0 : options.phx_submit) ? safe(` phx-submit="${options.phx_submit}"`) : "";
    const phx_change = (options === null || options === void 0 ? void 0 : options.phx_change) ? safe(` phx-change="${options.phx_change}"`) : "";
    const id = (options === null || options === void 0 ? void 0 : options.id) ? safe(` id="${options.id}"`) : "";
    // prettier-ignore
    return html `<form${id} action="${action}" method="${method}"${phx_submit}${phx_change}>`;
};

const text_input = (changeset, key, options) => {
    var _a, _b;
    const placeholder = (options === null || options === void 0 ? void 0 : options.placeholder) ? safe(` placeholder="${options.placeholder}"`) : "";
    const autocomplete = (options === null || options === void 0 ? void 0 : options.autocomplete) ? safe(` autocomplete="${options.autocomplete}"`) : "";
    const phx_debounce = (options === null || options === void 0 ? void 0 : options.phx_debounce) ? safe(` phx-debounce="${options.phx_debounce}"`) : "";
    const className = (options === null || options === void 0 ? void 0 : options.className) ? safe(` class="${options.className}"`) : "";
    const type = (_a = options === null || options === void 0 ? void 0 : options.type) !== null && _a !== void 0 ? _a : "text";
    const id = `input_${key}`;
    const value = (_b = changeset.data[key]) !== null && _b !== void 0 ? _b : "";
    // prettier-ignore
    return html `<input type="${type}" id="${id}" name="${String(key)}" value="${value}"${className}${autocomplete}${placeholder}${phx_debounce}/>`;
};
const telephone_input = (changeset, key, options) => {
    return text_input(changeset, key, { ...options, type: "tel" });
};
const error_tag = (changeset, key, options) => {
    var _a;
    const error = changeset.errors ? changeset.errors[key] : undefined;
    if (changeset.action && error) {
        const className = (_a = options === null || options === void 0 ? void 0 : options.className) !== null && _a !== void 0 ? _a : "invalid-feedback";
        return html `<span class="${className}" phx-feedback-for="${key}">${error}</span>`;
    }
    return html ``;
};

const live_flash = (flash, flashKey) => {
    var _a;
    if (!flash) {
        return html ``;
    }
    return html `${(_a = flash.getFlash(flashKey)) !== null && _a !== void 0 ? _a : ""}`;
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
    const { prefix, suffix } = options !== null && options !== void 0 ? options : {};
    const prefix_data = prefix ? safe(` data-prefix="${prefix}"`) : "";
    const suffix_data = suffix ? safe(` data-suffix="${suffix}"`) : "";
    return html `<title${prefix_data}${suffix_data}>${prefix !== null && prefix !== void 0 ? prefix : ""}${title}${suffix !== null && suffix !== void 0 ? suffix : ""}</title>`;
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
    const phx_disable_with = (options === null || options === void 0 ? void 0 : options.phx_disable_with) ? safe(` phx-disable-with="${options.phx_disable_with}"`) : "";
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
const handleHttpLiveView = async (idGenerator, csrfGenerator, liveView, adaptor, rootTemplateRenderer, pageTitleDefaults, liveViewTemplateRenderer) => {
    const { getSessionData, getRequestParameters, getRequestUrl, onRedirect } = adaptor;
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
    await liveView.mount({ _csrf_token: sessionData._csrf_token, _mounts: -1 }, { ...sessionData }, liveViewSocket);
    // check for redirects in `mount`
    if (liveViewSocket.redirect) {
        const { to } = liveViewSocket.redirect;
        onRedirect(to);
        return;
    }
    // execute the `LiveView`'s `handleParams` function, passing in the data from the HTTP request
    await liveView.handleParams(getRequestParameters(), getRequestUrl(), liveViewSocket);
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
            // params may be empty
            params = params !== null && params !== void 0 ? params : {};
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
    if (liveViewTemplateRenderer) {
        liveViewContent = liveViewTemplateRenderer({ ...sessionData }, safe(view));
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
    const rootView = rootTemplateRenderer(pageTitleDefaults !== null && pageTitleDefaults !== void 0 ? pageTitleDefaults : { title: "" }, sessionData._csrf_token, rootContent);
    return rootView.toString();
};

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
            valid: result.success,
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
    constructor() {
        this.subscribers = {};
    }
    async subscribe(topic, subscriber) {
        await eventEmitter.on(topic, subscriber);
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
        await eventEmitter.off(topic, subscriber);
        // remove subscriber from subscribers
        delete this.subscribers[subscriberId];
    }
}

class Flash extends Map {
    getFlash(key) {
        const value = this.get(key);
        this.delete(key);
        return value;
    }
}

var PhxSocketProtocolNames;
(function (PhxSocketProtocolNames) {
    PhxSocketProtocolNames[PhxSocketProtocolNames["joinRef"] = 0] = "joinRef";
    PhxSocketProtocolNames[PhxSocketProtocolNames["messageRef"] = 1] = "messageRef";
    PhxSocketProtocolNames[PhxSocketProtocolNames["topic"] = 2] = "topic";
    PhxSocketProtocolNames[PhxSocketProtocolNames["event"] = 3] = "event";
    PhxSocketProtocolNames[PhxSocketProtocolNames["payload"] = 4] = "payload";
})(PhxSocketProtocolNames || (PhxSocketProtocolNames = {}));

const newPhxReply = (from, payload) => {
    return [
        from[PhxSocketProtocolNames.joinRef],
        from[PhxSocketProtocolNames.messageRef],
        from[PhxSocketProtocolNames.topic],
        "phx_reply",
        payload,
    ];
};
const newHeartbeatReply = (incoming) => {
    return [
        null,
        incoming[PhxSocketProtocolNames.messageRef],
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
    constructor(component, connectionId, wsAdaptor, serDe, pubSub, liveViewRootTemplate) {
        this.subscriptionIds = {};
        this.intervals = [];
        this._events = [];
        this.eventAdded = false;
        this.pageTitleChanged = false;
        /**
         * Records for stateful components where key is a compound id `${componentName}_${componentId}`
         * and value is a tuple of [context, renderedPartsTree, changed, myself].
         *
         */
        this.statefulLiveComponents = {};
        this.statefuleLiveComponentInstances = {};
        this.liveView = component;
        this.connectionId = connectionId;
        this.wsAdaptor = wsAdaptor;
        this.serDe = serDe;
        this.pubSub = pubSub;
        this.liveViewRootTemplate = liveViewRootTemplate;
        // subscribe to events on connectionId which should just be
        // heartbeat messages
        const subId = this.pubSub.subscribe(connectionId, (data) => this.handleSubscriptions(data));
        // save subscription id for unsubscribing on shutdown
        this.subscriptionIds[connectionId] = subId;
    }
    async handleJoin(message) {
        const [joinRef, messageRef, topic, event, payload] = message;
        const { url: urlString, redirect: redirectString } = payload;
        const joinUrl = urlString || redirectString;
        // checked one of these was defined in MessageRouter
        const url = new URL(joinUrl);
        // @ts-ignore
        const urlParams = Object.fromEntries(url.searchParams);
        // extract params, session and socket from payload
        const { params: payloadParams, session: payloadSession, static: payloadStatic } = payload;
        // set component manager csfr token
        this.csrfToken = payloadParams._csrf_token;
        try {
            this.session = await this.serDe.deserialize(payloadSession);
            this.session.flash = new Flash(Object.entries(this.session.flash || {}));
            // compare sesison csrfToken with csrfToken from payload
            if (this.session._csrf_token !== this.csrfToken) {
                // if session csrfToken does not match payload csrfToken, reject join
                console.error("Rejecting join due to mismatched csrfTokens", this.session._csrf_token, this.csrfToken);
                return;
            }
        }
        catch (e) {
            console.error("Error decoding session", e);
            return;
        }
        this.joinId = topic;
        // subscribe to events on the socketId which includes
        // events, live_patch, and phx_leave messages
        const subId = this.pubSub.subscribe(this.joinId, (data) => this.handleSubscriptions(data));
        // again save subscription id for unsubscribing
        this.subscriptionIds[this.joinId] = subId;
        // create the liveViewSocket now
        this.socket = this.newLiveViewSocket();
        // initial lifecycle steps mount => handleParams => render
        await this.liveView.mount(payloadParams, this.session, this.socket);
        await this.liveView.handleParams(urlParams, joinUrl, this.socket);
        let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());
        // wrap in root template if there is one
        view = await this.maybeWrapInRootTemplate(view);
        // add `LiveComponent` to the render tree
        let rendered = this.maybeAddLiveComponentsToParts(view.partsTree());
        // change the page title if it has been set
        rendered = this.maybeAddPageTitleToParts(rendered);
        rendered = this.maybeAddEventsToParts(rendered);
        // send full view parts (statics & dynaimcs back)
        const replyPayload = {
            response: {
                rendered,
            },
            status: "ok",
        };
        this.sendPhxReply(newPhxReply(message, replyPayload));
        // remove temp data
        this.socket.updateContextWithTempAssigns();
    }
    async handleSubscriptions(phxMessage) {
        // console.log("handleSubscriptions", this.connectionId, this.joinId, phxMessage.type);
        const { type } = phxMessage;
        if (type === "heartbeat") {
            this.onHeartbeat(phxMessage.message);
        }
        else if (type === "event") {
            await this.onEvent(phxMessage.message);
        }
        else if (type === "live_patch") {
            await this.onLivePatch(phxMessage.message);
        }
        else if (type === "phx_leave") {
            this.onPhxLeave(phxMessage.message);
        }
        else {
            console.error("Unknown message type", type, phxMessage, " on connectionId:", this.connectionId, " socketId:", this.joinId);
        }
    }
    async onEvent(message) {
        const [joinRef, messageRef, topic, _, payload] = message;
        const { type, event, cid } = payload;
        // click and form events have different value in their payload
        // TODO - handle uploads
        let value;
        if (type === "click") {
            value = payload.value;
        }
        else if (type === "form") {
            // @ts-ignore - URLSearchParams has an entries method but not typed
            value = Object.fromEntries(new URLSearchParams(payload.value));
            // TODO - check value for _csrf_token here from phx_submit and validate against session csrf?
            // TODO - check for _target variable from phx_change here and remove it from value?
        }
        else if (type === "keyup" || type === "keydown") {
            value = payload.value;
        }
        else if (type === "blur" || type === "focus") {
            value = payload.value;
        }
        else if (type === "hook") {
            value = payload.value;
        }
        else {
            console.error("Unknown event type", type);
            return;
        }
        // determine if event is for `LiveComponent`
        if (cid !== undefined) {
            // console.log("LiveComponent event", type, cid, event, value);
            // find stateful component data by cid
            const statefulComponent = Object.values(this.statefulLiveComponents).find((c) => c.cid === cid);
            if (statefulComponent) {
                const { componentClass, context: oldContext, parts: oldParts, compoundId } = statefulComponent;
                // call event handler on stateful component instance
                const liveComponent = this.statefuleLiveComponentInstances[componentClass];
                if (liveComponent) {
                    // socker for this live component instance
                    const lcSocket = this.newLiveComponentSocket({ ...oldContext });
                    // run handleEvent and render then update context for cid
                    await liveComponent.handleEvent(event, value, lcSocket);
                    // TODO optimization - if contexts are the same, don't re-render
                    const newView = await liveComponent.render(lcSocket.context, { myself: cid });
                    //
                    const newParts = deepDiff(oldParts, newView.partsTree());
                    const changed = Object.keys(newParts).length > 0;
                    // store state for subsequent loads
                    this.statefulLiveComponents[compoundId] = {
                        ...statefulComponent,
                        context: lcSocket.context,
                        parts: newView.partsTree(),
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
                }
                else {
                    // not sure how we'd get here but just in case - ignore test coverage though
                    /* istanbul ignore next */
                    console.error("Could not find stateful component instance for", componentClass);
                }
            }
            else {
                console.error("Could not find stateful component for", cid);
            }
        }
        // event is not for LiveComponent rather it is for LiveView
        else {
            // console.log("LiveView event", type, event, value);
            if (isEventHandler(this.liveView) || event === "lv:clear-flash") {
                // copy previous context
                ({ ...this.socket.context });
                // check again because event could be a lv:clear-flash
                if (isEventHandler(this.liveView)) {
                    // @ts-ignore - already checked if handleEvent is defined
                    await this.liveView.handleEvent(event, value, this.socket);
                }
                // skip ctxEqual for now
                // const ctxEqual = areConte xtsValueEqual(previousContext, this.socket.context);
                let diff = {};
                // only calc diff if contexts have changed
                // if (!ctxEqual || event === "lv:clear-flash") {
                // get old render tree and new render tree for diffing
                // const oldView = await this.liveView.render(previousContext, this.defaultLiveViewMeta());
                let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());
                // wrap in root template if there is one
                view = await this.maybeWrapInRootTemplate(view);
                diff = view.partsTree();
                // diff = deepDiff(oldView.partsTree(), view.partsTree());
                // }
                diff = this.maybeAddPageTitleToParts(diff);
                diff = this.maybeAddEventsToParts(diff);
                const replyPayload = {
                    response: {
                        diff,
                    },
                    status: "ok",
                };
                this.sendPhxReply(newPhxReply(message, replyPayload));
                // remove temp data
                this.socket.updateContextWithTempAssigns();
            }
            else {
                console.error("no handleEvent method in component. add handleEvent method in your component to fix this error");
                return;
            }
        }
    }
    async onLivePatch(message) {
        const [joinRef, messageRef, topic, event, payload] = message;
        const { url: urlString } = payload;
        const url = new URL(urlString);
        // @ts-ignore - URLSearchParams has an entries method but not typed
        const params = Object.fromEntries(url.searchParams);
        this.socket.context;
        await this.liveView.handleParams(params, urlString, this.socket);
        // get old render tree and new render tree for diffing
        // const oldView = await this.component.render(previousContext, this.defaultLiveViewMeta());
        let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());
        // wrap in root template if there is one
        view = await this.maybeWrapInRootTemplate(view);
        // TODO - why is the diff causing live_patch to fail??
        // const diff = deepDiff(oldView.partsTree(), view.partsTree());
        let diff = this.maybeAddPageTitleToParts(view.partsTree(false));
        diff = this.maybeAddEventsToParts(diff);
        const replyPayload = {
            response: {
                diff,
            },
            status: "ok",
        };
        this.sendPhxReply(newPhxReply(message, replyPayload));
        // remove temp data
        this.socket.updateContextWithTempAssigns();
    }
    onHeartbeat(message) {
        // TODO - monitor lastHeartbeat and shutdown if it's been too long?
        this.sendPhxReply(newHeartbeatReply(message));
    }
    async onPhxLeave(message) {
        await this.shutdown();
    }
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
    repeat(fn, intervalMillis) {
        this.intervals.push(setInterval(fn, intervalMillis));
    }
    async onPushPatch(path, params, replaceHistory = false) {
        this.onPushNavigation("live_patch", path, params, replaceHistory);
    }
    async onPushRedirect(path, params, replaceHistory = false) {
        this.onPushNavigation("live_redirect", path, params, replaceHistory);
    }
    async onPushNavigation(navEvent, path, params, replaceHistory = false) {
        // make params into query string
        let stringParams;
        const urlParams = new URLSearchParams();
        if (params && Object.keys(params).length > 0) {
            for (const [key, value] of Object.entries(params)) {
                urlParams.set(key, String(value));
            }
            stringParams = urlParams.toString();
        }
        const to = stringParams ? `${path}?${stringParams}` : path;
        const kind = replaceHistory ? "replace" : "push";
        const message = [
            null,
            null,
            this.joinId,
            navEvent,
            { kind, to },
        ];
        // @ts-ignore - URLSearchParams has an entries method but not typed
        const searchParams = Object.fromEntries(urlParams);
        await this.liveView.handleParams(searchParams, to, this.socket);
        this.sendPhxReply(message);
        // remove temp data
        this.socket.updateContextWithTempAssigns();
    }
    async onPushEvent(event, value) {
        // queue event for sending
        this._events.push({ event, value });
        this.eventAdded = true;
    }
    putFlash(key, value) {
        this.session.flash.set(key, value);
    }
    async sendInternal(event) {
        // console.log("sendInternal", event, this.socketId);
        if (isInfoHandler(this.liveView)) {
            const previousContext = this.socket.context;
            // @ts-ignore - already checked if handleInfo is defined
            this.liveView.handleInfo(event, this.socket);
            let diff = {};
            // only calc diff if contexts have changed
            {
                // get old render tree and new render tree for diffing
                const oldView = await this.liveView.render(previousContext, this.defaultLiveViewMeta());
                let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());
                // wrap in root template if there is one
                view = await this.maybeWrapInRootTemplate(view);
                diff = deepDiff(oldView.partsTree(), view.partsTree());
            }
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
        else {
            console.error("received internal event but no handleInfo in component", this.liveView);
        }
    }
    set pageTitle(newTitle) {
        if (this._pageTitle !== newTitle) {
            this._pageTitle = newTitle;
            this.pageTitleChanged = true;
        }
    }
    async maybeWrapInRootTemplate(view) {
        if (this.liveViewRootTemplate) {
            return await this.liveViewRootTemplate(this.session, view);
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
        if (this.eventAdded) {
            this.eventAdded = false; // reset
            const e = [...this._events.map(({ event, value }) => [event, value])];
            this._events = []; // reset
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
        // this.ws.send(JSON.stringify(reply), { binary: false }, (err?: Error) => this.handleError(reply, err));
    }
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
        const componentClass = liveComponent.constructor.name;
        // cache single instance of each component type
        if (!this.statefuleLiveComponentInstances[componentClass]) {
            this.statefuleLiveComponentInstances[componentClass] = liveComponent;
        }
        // setup variables
        let context = { ...params };
        let newView;
        // determine if component is stateful or stateless
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
                myself = Object.keys(this.statefulLiveComponents).length + 1;
                // setup socket
                const lcSocket = this.newLiveComponentSocket({ ...context });
                // first load lifecycle mount => update => render
                await liveComponent.mount(lcSocket);
                await liveComponent.update(lcSocket);
                newView = await liveComponent.render(lcSocket.context, { myself });
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
                const lcSocket = this.newLiveComponentSocket({ ...oldContext });
                // subsequent loads lifecycle update => render (no mount)
                await liveComponent.update(lcSocket);
                newView = await liveComponent.render(lcSocket.context, { myself });
                const newParts = deepDiff(oldParts, newView.partsTree());
                const changed = Object.keys(newParts).length > 0;
                // store state for subsequent loads
                this.statefulLiveComponents[compoundId] = {
                    ...liveComponentData,
                    context: lcSocket.context,
                    parts: newView.partsTree(),
                    changed,
                };
            }
            // since stateful components are sent back as part of the render
            // tree (under the `c` key) we return an empty template here
            return new HtmlSafeString([String(myself)], [], true);
        }
        else {
            // stateless `LiveComponent`
            // lifecycle is:
            // 1. preload
            // 2. mount
            // 3. update
            // 4. render
            // setup socket
            const lcSocket = this.newLiveComponentSocket({ ...context });
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
                const { cid, parts } = componentData;
                // changedParts key is the myself id
                changedParts[`${cid}`] = parts;
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
        return parts;
    }
    defaultLiveViewMeta() {
        return {
            csrfToken: this.csrfToken,
            live_component: async (liveComponent, params) => {
                const render = await this.liveComponentProcessor(liveComponent, params);
                return render;
            },
        };
    }
    newLiveViewSocket() {
        return new WsLiveViewSocket(this.joinId, (newTitle) => {
            this.pageTitle = newTitle;
        }, (event, params) => this.onPushEvent(event, params), (path, params, replace) => this.onPushPatch(path, params, replace), (path, params, replace) => this.onPushRedirect(path, params, replace), (key, value) => this.putFlash(key, value), (fn, intervalMillis) => this.repeat(fn, intervalMillis), (event) => this.sendInternal(event), (topic) => {
            const subId = this.pubSub.subscribe(topic, (event) => this.sendInternal(event));
            this.subscriptionIds[topic] = subId;
        });
    }
    newLiveComponentSocket(context) {
        return new WsLiveComponentSocket(this.joinId, context, (event) => this.sendInternal(event), (event, params) => this.onPushEvent(event, params));
    }
}
function isInfoHandler(component) {
    return "handleInfo" in component;
}
function isEventHandler(component) {
    return "handleEvent" in component;
}
// export function areContextsValueEqual(context1: LiveComponentContext, context2: LiveComponentContext): boolean {
//   if (!!context1 && !!context2) {
//     const c1 = fromJS(context1);
//     const c2 = fromJS(context2);
//     return c1.equals(c2);
//   } else {
//     return false;
//   }
// }

class WsMessageRouter {
    constructor(serDe, pubSub, liveViewRootTemplate) {
        this.serDe = serDe;
        this.pubSub = pubSub;
        this.liveViewRootTemplate = liveViewRootTemplate;
    }
    async onMessage(wsAdaptor, messageString, router, connectionId) {
        // parse string to JSON
        const rawPhxMessage = JSON.parse(messageString);
        // rawPhxMessage must be an array with 5 elements
        if (typeof rawPhxMessage === "object" && Array.isArray(rawPhxMessage) && rawPhxMessage.length === 5) {
            const [joinRef, messageRef, topic, event, payload] = rawPhxMessage;
            let message = rawPhxMessage;
            try {
                switch (event) {
                    case "phx_join":
                        // handle phx_join seperate from other events so we can create a new
                        // component manager and send the join message to it
                        await this.onPhxJoin(wsAdaptor, rawPhxMessage, router, connectionId);
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
                console.error(`error handling phx message ${message}`, e);
            }
        }
        else {
            // message format is incorrect so say something
            console.error(`error unknown message type for connectionId "${connectionId}". `, rawPhxMessage);
        }
    }
    async onClose(code, connectionId) {
        // when client closes connection send phx_leave message
        // to component manager via connectionId broadcast
        await this.pubSub.broadcast(connectionId, {
            type: "phx_leave",
            message: [null, null, "phoenix", "phx_leave", {}],
        });
    }
    async onPhxJoin(wsAdaptor, message, router, connectionId) {
        // use url to route join request to component
        const [joinRef, messageRef, topic, event, payload] = message;
        const { url: urlString, redirect: redirectString } = payload;
        const joinUrl = urlString || redirectString;
        if (!joinUrl) {
            throw Error(`no url or redirect in join message ${message}`);
        }
        const url = new URL(joinUrl);
        const component = router[url.pathname];
        if (!component) {
            throw Error(`no component found for ${url}`);
        }
        const liveViewManager = new LiveViewManager(component, connectionId, wsAdaptor, this.serDe, this.pubSub, this.liveViewRootTemplate);
        await liveViewManager.handleJoin(message);
    }
}

export { BaseLiveComponent, BaseLiveView, HtmlSafeString, HttpLiveComponentSocket, HttpLiveViewSocket, LiveViewManager, SingleProcessPubSub, WsLiveComponentSocket, WsLiveViewMeta, WsLiveViewSocket, WsMessageRouter, deepDiff, diffArrays, error_tag, escapehtml, form_for, handleHttpLiveView, html, isEventHandler, isInfoHandler, join, live_flash, live_patch, live_title_tag, newChangesetFactory, options_for_select, safe, submit, telephone_input, text_input };
