
/// <reference types="./liveview.d.ts" />
import { match } from 'path-to-regexp';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import EventEmitter from 'events';

class BaseLiveComponentSocket {
    id;
    _context;
    constructor(id, context) {
        this.id = id;
        this._context = context ?? {};
    }
    get context() {
        return this._context;
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
    shutdown(id, context) {
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
        shutdown: () => { },
        // replace default impls with params if they are defined
        ...params,
    };
};

const matchFns = {};
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
function matchRoute(router, path) {
    for (const route in router) {
        let matchFn = matchFns[route];
        if (!matchFn) {
            // lazy init match function
            matchFn = match(route, { decode: decodeURIComponent });
            matchFns[route] = matchFn;
        }
        // match the path to the route match function
        const matchResult = matchFn(path);
        if (matchResult) {
            return [router[route], matchResult];
        }
    }
    return undefined;
}

/**
 * UploadConfig contains configuration and entry related details for uploading files.
 */
class UploadConfig {
    constructor(name, options) {
        this.name = name;
        this.accept = options?.accept ?? [];
        this.max_entries = options?.max_entries ?? 1;
        this.max_file_size = options?.max_file_size ?? 10 * 1024 * 1024; // 10MB
        this.auto_upload = options?.auto_upload ?? false;
        this.chunk_size = options?.chunk_size ?? 64 * 1024; // 64kb
        this.entries = [];
        this.ref = `phx-${nanoid()}`;
        this.errors = [];
    }
    /**
     * Set the entries for the config.
     * @param entries UploadEntry[] to set
     */
    setEntries(entries) {
        this.entries = [...entries];
        this.validate();
    }
    /**
     * Remove an entry from the config.
     * @param ref The unique ref of the UploadEntry to remove.
     */
    removeEntry(ref) {
        const entryIndex = this.entries.findIndex((entry) => entry.ref === ref);
        if (entryIndex > -1) {
            this.entries.splice(entryIndex, 1);
        }
        this.validate();
    }
    /**
     * Returns all the entries (throws if any are still uploading) and removes
     * the entries from the config.
     */
    consumeEntries() {
        const entries = [...this.entries];
        this.entries = [];
        this.validate();
        return entries;
    }
    /**
     * Checks if the entries are valid w.r.t. max_entries, max_file_size, and mime type.
     */
    validate() {
        this.errors = [];
        if (this.entries.length > this.max_entries) {
            this.errors.push("Too many files");
        }
        // add errors from entries
        this.entries.forEach((entry) => {
            if (!entry.valid) {
                this.errors.push(...entry.errors);
            }
        });
    }
}

/*
 * Welp there isn't a cross platform mime type library for both
 * nodejs and deno.  So instead we'll download the mime-db json from
 * the CDN and use that to map from mime-types to extensions.
 */
const MIME_DB_URL = "https://cdn.jsdelivr.net/gh/jshttp/mime-db@master/db.json";
/**
 * A class for looking up mime type extensions built on top of the mime-db.
 */
class Mime {
    db;
    extensions = {};
    #loaded = false;
    constructor() {
        this.load();
    }
    /**
     * Given a mime type, return the string[] of extensions associated with it.
     * @param mimeType the string mime type to lookup
     * @returns the string[] of extensions associated with the mime type or an empty array if none are found.
     */
    lookupExtensions(mimeType) {
        return this.db[mimeType]?.extensions || [];
    }
    /**
     * Given an extension (without the leading dot), return the string[] of mime types associated with it.
     * @param ext the extension (without leading dot) to lookup
     * @returns the string[] of mime types associated with the extension or an empty array if none are found.
     */
    lookupMimeType(ext) {
        return this.extensions[ext] || [];
    }
    get loaded() {
        return this.#loaded;
    }
    async load() {
        if (this.loaded)
            return;
        try {
            if (globalThis && !globalThis.fetch) {
                // only Node 18+ and Deno have fetch so fall back to https
                //  implementation if globalThis.fetch is not defined.
                this.db = await nodeHttpFetch(MIME_DB_URL);
            }
            else {
                const res = await fetch(MIME_DB_URL);
                // istanbul ignore next
                if (!res.ok) {
                    // istanbul ignore next
                    throw new Error(`Failed to load mime-db: ${res.status} ${res.statusText}`);
                }
                this.db = await res.json();
            }
            // build a reverse lookup table for extensions to mime types
            Object.keys(this.db).forEach((mimeType, i) => {
                const exts = this.lookupExtensions(mimeType);
                exts.forEach((ext) => {
                    if (!this.extensions[ext]) {
                        this.extensions[ext] = [];
                    }
                    this.extensions[ext].push(mimeType);
                });
            });
            this.#loaded = true;
        }
        catch (e) {
            // istanbul ignore next
            console.error(e);
            // istanbul ignore next
            this.#loaded = false;
        }
    }
}
/**
 * Fallback implementation of getting JSON from a URL for Node <18.
 * @param url the url to fetch
 * @returns the JSON object returned from the URL
 */
function nodeHttpFetch(url) {
    return new Promise((resolve, reject) => {
        const https = require("https");
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                res.resume(); // ignore response body
                reject(res.statusCode);
            }
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("close", () => {
                resolve(JSON.parse(data));
            });
        });
    });
}
const mime = new Mime();

/**
 * UploadEntry represents a file and related metadata selected for upload
 */
class UploadEntry {
    #config; // the parent upload config
    #tempFile; // the temp file location where the file is stored
    constructor(upload, config) {
        this.cancelled = false;
        this.last_modified = upload.last_modified;
        this.name = upload.name;
        this.size = upload.size;
        this.type = upload.type;
        this.done = false;
        this.preflighted = false;
        this.progress = 0;
        this.ref = upload.ref;
        this.upload_ref = config.ref;
        this.uuid = nanoid();
        this.errors = [];
        this.valid = true;
        this.#config = config;
        this.validate();
    }
    /**
     * Takes in a progress percentage and updates the entry accordingly
     * @param progress
     */
    updateProgress(progress) {
        if (progress < 0) {
            progress = 0;
        }
        if (progress > 100) {
            progress = 100;
        }
        this.progress = progress;
        this.preflighted = progress > 0;
        this.done = progress === 100;
    }
    /**
     * Validates the file against the upload config
     */
    validate() {
        this.errors = [];
        // validate file size
        if (this.size > this.#config.max_file_size) {
            this.errors.push("Too large");
        }
        // validate mime type is allowed
        if (this.#config.accept.length > 0) {
            // client type is a mime type but accept list can be either a mime type or extension
            // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers
            let allowed = false;
            for (let i = 0; i < this.#config.accept.length; i++) {
                const acceptItem = this.#config.accept[i];
                if (acceptItem.startsWith(".")) {
                    // extension so look up mime type (first trim off the leading dot)
                    const mimeTypes = mime.lookupMimeType(acceptItem.slice(1));
                    if (mimeTypes.includes(this.type)) {
                        allowed = true;
                        break;
                    }
                }
                else {
                    // mime type so check if it matches
                    if (acceptItem === this.type) {
                        allowed = true;
                        break;
                    }
                }
            }
            if (!allowed) {
                this.errors.push("Not allowed");
            }
        }
        this.valid = this.errors.length === 0;
    }
    /**
     * Sets the temp file path for the entry, used internally
     * @param tempFilePath a path to the temp file
     */
    setTempFile(tempFilePath) {
        this.#tempFile = tempFilePath;
    }
    /**
     * Gets the temp file path for the entry, used internally
     * @returns the temp file path
     */
    getTempFile() {
        return this.#tempFile;
    }
}

/**
 * Checks if globalThis has a `structuredClone` function and if not, adds one
 * that uses `JSON.parse(JSON.stringify())` as a fallback.  This is needed
 * for Node version <17.
 */
function maybeAddStructuredClone() {
    /**
     * Really bad implementation of structured clone algorithm to backfill for
     * Node 16 (and below).
     */
    if (globalThis && !globalThis.structuredClone) {
        globalThis.structuredClone = (value, transfer) => JSON.parse(JSON.stringify(value));
    }
}

maybeAddStructuredClone();
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
    sendInfo(info) {
        // no-op
    }
    subscribe(topic) {
        // no-op
        // istanbul ignore next
        return Promise.resolve();
    }
    allowUpload(name, options) {
        // no-op
        // istanbul ignore next
        return Promise.resolve();
    }
    cancelUpload(configName, ref) {
        // no-op
        // istanbul ignore next
        return Promise.resolve();
    }
    consumeUploadedEntries(configName, fn) {
        // no-op
        // istanbul ignore next
        return Promise.resolve([]);
    }
    uploadedEntries(configName) {
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
class HttpLiveViewSocket extends BaseLiveViewSocket {
    id;
    connected = false;
    uploadConfigs = {};
    url;
    _redirect;
    constructor(id, url) {
        super();
        this.id = id;
        this.url = url;
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
    allowUpload(name, options) {
        this.uploadConfigs[name] = new UploadConfig(name, options);
        return Promise.resolve();
    }
}
/**
 * Full inmplementation used once a `LiveView` is mounted to a websocket.
 * In practice, this uses callbacks defined in the LiveViewManager that
 * capture state and manipulate it in the context of that LiveViewManager instance.
 */
class WsLiveViewSocket extends BaseLiveViewSocket {
    id;
    connected = true;
    url;
    // callbacks to the ComponentManager
    pageTitleCallback;
    pushEventCallback;
    pushPatchCallback;
    pushRedirectCallback;
    putFlashCallback;
    sendInfoCallback;
    subscribeCallback;
    allowUploadCallback;
    cancelUploadCallback;
    consumeUploadedEntriesCallback;
    uploadedEntriesCallback;
    constructor(id, url, pageTitleCallback, pushEventCallback, pushPatchCallback, pushRedirectCallback, putFlashCallback, sendInfoCallback, subscribeCallback, allowUploadCallback, cancelUploadCallback, consumeUploadedEntriesCallback, uploadedEntriesCallback) {
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
    sendInfo(info) {
        this.sendInfoCallback(info);
    }
    async subscribe(topic) {
        await this.subscribeCallback(topic);
    }
    async allowUpload(name, options) {
        await this.allowUploadCallback(name, options);
    }
    async cancelUpload(configName, ref) {
        await this.cancelUploadCallback(configName, ref);
    }
    async consumeUploadedEntries(configName, fn) {
        return await this.consumeUploadedEntriesCallback(configName, fn);
    }
    async uploadedEntries(configName) {
        return await this.uploadedEntriesCallback(configName);
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
    if (Object.keys(oldParts).length !== Object.keys(newParts).length) {
        diff = newParts;
        return diff;
    }
    // if JSON.strigifys are different then iterate through keys
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
                // if length of statics array is different than we have different
                // number of dynamics as well. so instead of diffing the old vs new
                // parts trees by key, we just return the full new parts tree.
                // Technically this should be caught before we loop through the keys
                // where we compare lenth of keys of oldParts and newParts.
                // TODO - throw warning perhaps?
                diff = newParts;
                break;
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
/**
 * HtmlSafeString is what a `LiveView` returns from its `render` function.
 * It is based on "tagged template literals" and is what allows LiveViewJS
 * to minimize the amount of data sent to the client.
 */
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
                        // probably added an array of objects directly
                        // e.g. to the dynamic e.g. ${myArray}
                        // so just render the object as a string
                        s = cur.map((c) => String(c));
                        return {
                            ...acc,
                            [`${index}`]: s.join(""),
                        };
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
    const id = `input_${String(key)}`;
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

/**
 * Creates the html for a file input that can be used to upload files to the server.
 * @param uploadConfig the upload config to use for the file input
 * @returns the html for the file input
 */
function live_file_input(uploadConfig) {
    const { name, accept, max_entries: maxEntries, ref, entries } = uploadConfig;
    const multiple = maxEntries > 1 ? "multiple" : "";
    const activeRefs = entries.map((entry) => entry.ref).join(",");
    const doneRefs = entries
        .filter((entry) => entry?.done ?? false)
        .map((entry) => entry.ref)
        .join(",");
    const preflightedRefs = entries
        .filter((entry) => entry?.preflighted ?? false)
        .map((entry) => entry.ref)
        .join(",");
    return html `
    <input
      id="${ref}"
      type="file"
      name="${name}"
      accept="${accept.join(",")}"
      data-phx-active-refs="${activeRefs}"
      data-phx-done-refs="${doneRefs}"
      data-phx-preflighted-refs="${preflightedRefs}"
      data-phx-update="ignore"
      data-phx-upload-ref="${ref}"
      phx-hook="Phoenix.LiveFileUpload"
      ${multiple} />
  `;
}

function live_img_preview(entry) {
    const { ref, upload_ref } = entry;
    return html `
    <img
      id="phx-preview-${ref}"
      data-phx-upload-ref="${upload_ref}"
      data-phx-entry-ref="${ref}"
      data-phx-hook="Phoenix.LiveImgPreview"
      data-phx-update="ignore" />
  `;
}

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
    const attrs = Object.entries(options || {}).reduce((acc, [key, value]) => {
        if (key === "disabled") {
            acc += value ? safe(` disabled`) : "";
        }
        else if (key === "phx_disable_with") {
            acc += safe(` phx-disable-with="${escapehtml(value)}"`);
        }
        else {
            acc += safe(` ${key}="${escapehtml(value)}"`);
        }
        return acc;
    }, "");
    // prettier-ignore
    return html `<button type="submit"${safe(attrs)}>${label}</button>`;
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
class JS {
    cmds = [];
    /**
     * Adds the css class(es) to the target element
     * @param names the css class(es) to add (space delimited)
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    add_class(names, options) {
        this.cmds = [
            ...this.cmds,
            [
                "add_class",
                {
                    to: options?.to ?? null,
                    time: options?.time ?? 200,
                    names: names.split(/\s+/),
                    transition: transitionOptionsToCmd(options?.transition),
                },
            ],
        ];
        return this;
    }
    /**
     * Removes the css class(es) from the target element
     * @param names the css class(es) to remove (space delimited)
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    remove_class(names, options) {
        this.cmds = [
            ...this.cmds,
            [
                "remove_class",
                {
                    to: options?.to ?? null,
                    time: options?.time ?? 200,
                    names: names.split(/\s+/),
                    transition: transitionOptionsToCmd(options?.transition),
                },
            ],
        ];
        return this;
    }
    /**
     * Shows the target element
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    show(options) {
        this.cmds = [
            ...this.cmds,
            [
                "show",
                {
                    to: options?.to ?? null,
                    time: options?.time ?? 200,
                    transition: transitionOptionsToCmd(options?.transition),
                    display: options?.display ?? null,
                },
            ],
        ];
        return this;
    }
    /**
     * Hides the target element
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    hide(options) {
        this.cmds = [
            ...this.cmds,
            [
                "hide",
                {
                    to: options?.to ?? null,
                    time: options?.time ?? 200,
                    transition: transitionOptionsToCmd(options?.transition),
                },
            ],
        ];
        return this;
    }
    /**
     * Toggles the visibility of the target element
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    toggle(options) {
        this.cmds = [
            ...this.cmds,
            [
                "toggle",
                {
                    to: options?.to ?? null,
                    time: options?.time ?? 200,
                    ins: transitionOptionsToCmd(options?.in),
                    outs: transitionOptionsToCmd(options?.out),
                    display: options?.display ?? null,
                },
            ],
        ];
        return this;
    }
    /**
     * Sets the given attribute on the target element
     * @param attr the 2-tuple of the attribute name and value to set
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    set_attribute(attr, options) {
        this.cmds = [
            ...this.cmds,
            [
                "set_attr",
                {
                    to: options?.to ?? null,
                    attr,
                },
            ],
        ];
        return this;
    }
    /**
     * Removes the given attribute from the target element
     * @param attr the attribute name to remove
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    remove_attribute(attr, options) {
        this.cmds = [
            ...this.cmds,
            [
                "remove_attr",
                {
                    to: options?.to ?? null,
                    attr,
                },
            ],
        ];
        return this;
    }
    /**
     * Applies the given transition to the target element
     * @param transition the transition to apply
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    transition(transition, options) {
        this.cmds = [
            ...this.cmds,
            [
                "transition",
                {
                    to: options?.to ?? null,
                    time: options?.time ?? 200,
                    transition: transitionOptionsToCmd(transition),
                },
            ],
        ];
        return this;
    }
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
    dispatch(event, options) {
        this.cmds = [
            ...this.cmds,
            [
                "dispatch",
                {
                    to: options?.to ?? null,
                    event,
                    detail: options?.detail,
                    bubbles: options?.bubbles,
                },
            ],
        ];
        return this;
    }
    /**
     * Pushes the given event to the server
     * @param event the event to push
     * @param options the options for the command
     * @returns this instance for further chaining
     */
    push(event, options) {
        this.cmds = [
            ...this.cmds,
            [
                "push",
                {
                    event,
                    ...options,
                },
            ],
        ];
        return this;
    }
    /**
     * @returns JSON stringified commands for embedding in HTML
     */
    toString() {
        return JSON.stringify(this.cmds);
    }
}
/**
 * Convert a transition option to a transition body command
 */
function transitionOptionsToCmd(opts) {
    if (opts === undefined) {
        return [[], [], []];
    }
    else if (typeof opts === "string") {
        return [opts.split(/\s+/), [], []];
    }
    // split each transition option into an array of classes
    return [opts[0].split(/\s+/), opts[1].split(/\s+/), opts[2].split(/\s+/)];
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
const handleHttpLiveView = async (idGenerator, csrfGenerator, liveView, adaptor, pageRenderer, pathParams, pageTitleDefaults, rootRenderer) => {
    const { getSessionData, getRequestUrl, onRedirect } = adaptor;
    // new LiveViewId for each request
    const liveViewId = idGenerator();
    // extract csrf token from session data or generate it if it doesn't exist
    const sessionData = getSessionData();
    if (sessionData._csrf_token === undefined) {
        sessionData._csrf_token = csrfGenerator();
    }
    // prepare a http socket for the `LiveView` render lifecycle: mount => handleParams => render
    const liveViewSocket = new HttpLiveViewSocket(liveViewId, getRequestUrl());
    // execute the `LiveView`'s `mount` function, passing in the data from the HTTP request
    await liveView.mount(liveViewSocket, { ...sessionData }, { _csrf_token: sessionData._csrf_token, _mounts: -1, ...pathParams });
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
        uploads: liveViewSocket.uploadConfigs,
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
        // istanbul ignore next
        if (session.__flash === undefined) {
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
        // istanbul ignore next
        if (session.__flash === undefined) {
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
            // check if _target is present in newAttrs and if so, only include
            // error(s) for that field
            const target = newAttrs["_target"] ?? false;
            errors = result.error.issues.reduce((acc, issue) => {
                // TODO recursively walk the full tree of fields for the issues?
                if (target) {
                    if (issue.path[0] === target) {
                        // @ts-ignore
                        acc[target] = issue.message;
                        return acc;
                    }
                    // do not include other fields in the errors if the target is present
                    return acc;
                }
                // @ts-ignore
                acc[issue.path[0]] = issue.message;
                return acc;
            }, {});
        }
        return {
            action,
            changes: updatedDiff(existing, merged),
            data: result.success ? result.data : merged,
            // if action is empty then we assume no validation rules are being applied
            valid: action !== undefined ? result.success : true,
            errors,
        };
    };
};

/**
 * BinaryUploadSerDe is a serializer/deserializer for binary (file) uploads from LiveViews.
 */
class BinaryUploadSerDe {
    /**
     * Deserialize a binary upload message into a Phx.UploadMsg.
     * @param data Buffer of binary data
     * @returns the Phx.UploadMsg
     */
    deserialize(data) {
        // read first 5 bytes to get sizes of parts
        const sizesOffset = 5;
        const sizes = data.subarray(0, sizesOffset);
        const startSize = parseInt(sizes[0].toString());
        // istanbul ignore next
        if (startSize !== 0) {
            // istanbul ignore next
            throw Error(`Unexpected startSize from uploadBinary: ${sizes.subarray(0, 1).toString()}`);
        }
        const joinRefSize = parseInt(sizes[1].toString());
        const messageRefSize = parseInt(sizes[2].toString());
        const topicSize = parseInt(sizes[3].toString());
        const eventSize = parseInt(sizes[4].toString());
        // read header and header parts
        const headerLength = startSize + joinRefSize + messageRefSize + topicSize + eventSize;
        const header = data.subarray(sizesOffset, sizesOffset + headerLength).toString();
        let start = 0;
        let end = joinRefSize;
        const joinRef = header.slice(0, end).toString();
        start += joinRefSize;
        end += messageRefSize;
        const msgRef = header.slice(start, end).toString();
        start += messageRefSize;
        end += topicSize;
        const topic = header.slice(start, end).toString();
        start += topicSize;
        end += eventSize;
        const event = header.slice(start, end).toString();
        // adjust data index based on message length
        const dataStartIndex = sizesOffset + headerLength;
        // get rest of data
        const payload = data.subarray(dataStartIndex);
        return {
            joinRef,
            msgRef,
            topic,
            event,
            payload,
        };
    }
    /**
     * Serialize a Phx.UploadMsg into a Buffer. (typically used for testing)
     * @param value a Phx.UploadMsg
     * @returns a Buffer of binary data
     */
    serialize(value) {
        const { joinRef, msgRef, topic, event, payload } = value;
        const joinRefSize = Buffer.byteLength(joinRef);
        const messageRefSize = Buffer.byteLength(msgRef);
        const topicSize = Buffer.byteLength(topic);
        const eventSize = Buffer.byteLength(event);
        const dataLength = payload.length;
        const headerLength = joinRefSize + messageRefSize + topicSize + eventSize;
        const sizes = Buffer.from([0, joinRefSize, messageRefSize, topicSize, eventSize]);
        const header = Buffer.from(`${joinRef}${msgRef}${topic}${event}`);
        const buffer = Buffer.concat([sizes, header, payload], sizes.length + headerLength + dataLength);
        return buffer;
    }
}

/**
 * Phx is a namespace for Phoenix LiveView protocol related types and functions.
 */
var Phx;
(function (Phx) {
    (function (MsgIdx) {
        MsgIdx[MsgIdx["joinRef"] = 0] = "joinRef";
        MsgIdx[MsgIdx["msgRef"] = 1] = "msgRef";
        MsgIdx[MsgIdx["topic"] = 2] = "topic";
        MsgIdx[MsgIdx["event"] = 3] = "event";
        MsgIdx[MsgIdx["payload"] = 4] = "payload";
    })(Phx.MsgIdx || (Phx.MsgIdx = {}));
    /**
     * parse attempts to parse a string into a Msg.
     * @param msg the string to parse
     * @returns the parsed Msg
     * @throws an error if the message is invalid
     */
    function parse(msg) {
        const m = JSON.parse(msg);
        if (!Array.isArray(m) && m.length < 5) {
            throw new Error("invalid phx message");
        }
        // TODO validate other parts of message (e.g. topic, event, etc)
        return m;
    }
    Phx.parse = parse;
    /**
     * parseBinary attempts to parse a binary buffer into a Msg<Buffer>.
     * @param raw the binary buffer to parse
     * @returns a Msg<Buffer>
     */
    function parseBinary(raw) {
        const um = new BinaryUploadSerDe().deserialize(raw);
        return [um.joinRef, um.msgRef, um.topic, um.event, um.payload];
    }
    Phx.parseBinary = parseBinary;
    /**
     * serialize serializes a Msg into a string typically for sending across the socket back to the client.
     * @param msg the Msg to serialize
     * @returns the serialized Msg
     */
    function serialize(msg) {
        return JSON.stringify(msg);
    }
    Phx.serialize = serialize;
})(Phx || (Phx = {}));

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
        try {
            // get subscriber function from id
            const subscriber = this.subscribers[subscriberId];
            if (subscriber) {
                await eventEmitter.removeListener(topic, subscriber);
            }
            // remove subscriber from subscribers
            delete this.subscribers[subscriberId];
        }
        catch (err) {
            console.warn("error unsubscribing from topic", topic, err);
        }
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
    const joinRef = from[PhxProtocol.joinRef];
    const messageRef = from[PhxProtocol.messageRef];
    const topic = from[PhxProtocol.topic];
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

maybeAddStructuredClone();
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
    fileSystemAdaptor;
    uploadConfigs = {};
    activeUploadRef;
    csrfToken;
    pathParams;
    _infoQueue = [];
    _events = [];
    _pageTitle;
    pageTitleChanged = false;
    socket;
    liveViewRootTemplate;
    hasWarnedAboutMissingCsrfToken = false;
    _parts;
    _cidIndex = 0;
    constructor(liveView, connectionId, wsAdaptor, serDe, pubSub, flashAdaptor, fileAdapter, pathParams, liveViewRootTemplate) {
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
                    // parse uploads into uploadConfig for given name
                    if (payload.uploads) {
                        const { uploads } = payload;
                        // get _target from form data
                        const target = value["_target"];
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
    async onAllowUpload(message) {
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
            let diff = deepDiff(this._parts, newParts);
            // reset parts to new parts
            this._parts = newParts;
            // add the rest of the things
            diff = this.maybeAddPageTitleToParts(diff);
            diff = this.maybeAddEventsToParts(diff);
            // TODO allow configuration settings for server
            const config = {
                chunk_size: 64000,
                max_entries: 10,
                max_file_size: 10 * 1024 * 1024, // 10MB
            };
            const entriesReply = {
                ref,
            };
            entries.forEach(async (entry) => {
                try {
                    // this reply ends up been the "token" for the onPhxJoinUpload
                    entriesReply[entry.ref] = JSON.stringify(entry);
                }
                catch (e) {
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
        }
        catch (e) {
            /* istanbul ignore next */
            console.error("Error handling allow_upload", e);
        }
    }
    async onPhxJoinUpload(message) {
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
        }
        catch (e) {
            /* istanbul ignore next */
            console.error("Error handling onPhxJoinUpload", e);
        }
    }
    async onUploadBinary(message) {
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
            const diffMessage = [joinRef, null, this.joinId, "diff", {}];
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
        }
        catch (e) {
            /* istanbul ignore next */
            console.error("Error handling onUploadBinary", e);
        }
    }
    async onProgressUpload(message) {
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
            }
            else {
                // istanbul ignore next
                console.error("Received progress upload but could not find upload config for ref", ref);
            }
            let view = await this.liveView.render(this.socket.context, this.defaultLiveViewMeta());
            // wrap in root template if there is one
            view = await this.maybeWrapInRootTemplate(view);
            // diff the new view with the old view
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
            console.error("Error handling allow_upload", e);
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
            await this.liveView.handleInfo(info, this.socket);
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
            uploads: this.uploadConfigs,
        };
    }
    newLiveViewSocket() {
        return new WsLiveViewSocket(
        // id
        this.joinId, 
        // url
        this.url, 
        // pageTitleCallback
        (newTitle) => {
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
        async (topic) => {
            const subId = this.pubSub.subscribe(topic, (info) => {
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
            }
            else {
                // istanbul ignore next
                console.warn(`Upload config ${configName} not found for cancelUpload`);
            }
        }, 
        // consumeUploadedEntriesCallback
        async (configName, fn) => {
            // console.log("consomeUploadedEntries", configName, fn);
            const uploadConfig = this.uploadConfigs[configName];
            if (uploadConfig) {
                const inProgress = uploadConfig.entries.some((entry) => !entry.done);
                if (inProgress) {
                    throw new Error("Cannot consume entries while uploads are still in progress");
                }
                // noting is in progress so we can consume
                const entries = uploadConfig.consumeEntries();
                return await Promise.all(entries.map(async (entry) => await fn({ path: entry.getTempFile(), fileSystem: this.fileSystemAdaptor }, entry)));
            }
            console.warn(`Upload config ${configName} not found for consumeUploadedEntries`);
            return [];
        }, 
        // uploadedEntriesCallback
        async (configName) => {
            // console.log("uploadedEntries", configName);
            const completed = [];
            const inProgress = [];
            const uploadConfig = this.uploadConfigs[configName];
            if (uploadConfig) {
                uploadConfig.entries.forEach((entry) => {
                    if (entry.done) {
                        completed.push(entry);
                    }
                    else {
                        inProgress.push(entry);
                    }
                });
            }
            else {
                // istanbul ignore next
                console.warn(`Upload config ${configName} not found for uploadedEntries`);
            }
            return {
                completed,
                inProgress,
            };
        });
    }
    newLiveComponentSocket(context) {
        return new WsLiveComponentSocket(this.joinId, context, (info) => this.onSendInfo(info), (event) => this.onPushEvent(event));
    }
}

/**
 * PhxReply is a namespace for Phx protocol related types and functions typically send from the server to the client.
 */
var PhxReply;
(function (PhxReply) {
    /**
     * renderedReply builds a reply that contains the full rendered HTML for a LiveView.
     * @param msg the original, incoming message (used to get the joinRef, msgRef, and topic)
     * @param parts the "tree" of parts that will be used to render the client-side LiveView
     * @returns the reply message
     */
    function renderedReply(msg, parts) {
        return [
            msg[Phx.MsgIdx.joinRef],
            msg[Phx.MsgIdx.msgRef],
            msg[Phx.MsgIdx.topic],
            "phx_reply",
            {
                status: "ok",
                response: {
                    rendered: parts,
                },
            },
        ];
    }
    PhxReply.renderedReply = renderedReply;
    /**
     * diff builds a diff message which only contains the parts of the LiveView that have changed.
     * As opposed to "diffReply" messages, "diff" messages are sent without an original, incoming message but rather because of
     * a "server-side" event that triggers a change in the `LiveView`
     * @param joinRef optional joinRef
     * @param topic the topic (typically the LiveView's socket id)
     * @param diff the "diffed" parts of the LiveView that have changed
     * @returns a diff message
     */
    function diff(joinRef, topic, diff) {
        return [joinRef, null, topic, "diff", diff];
    }
    PhxReply.diff = diff;
    /**
     * diffReply builds a diff reply message which only contains the parts of the LiveView that have changed.
     * As opposed to "diff" messages, "diffReply" messages are sent in response to an incoming message from the client.
     * @param msg the original, incoming message (used to get the joinRef, msgRef, and topic)
     * @param diff the "diffed" parts of the LiveView that have changed
     * @returns a diff reply message
     */
    function diffReply(msg, diff) {
        return [
            msg[Phx.MsgIdx.joinRef],
            msg[Phx.MsgIdx.msgRef],
            msg[Phx.MsgIdx.topic],
            "phx_reply",
            {
                status: "ok",
                response: {
                    diff,
                },
            },
        ];
    }
    PhxReply.diffReply = diffReply;
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
    function allowUploadReply(msg, diff, config, entries) {
        return [
            msg[Phx.MsgIdx.joinRef],
            msg[Phx.MsgIdx.msgRef],
            msg[Phx.MsgIdx.topic],
            "phx_reply",
            {
                status: "ok",
                response: {
                    diff,
                    config,
                    entries,
                },
            },
        ];
    }
    PhxReply.allowUploadReply = allowUploadReply;
    /**
     * heartbeat builds a heartbeat reply message which is used to respond to a heartbeat message from the client.
     * @param msg the original, incoming message (used to get the joinRef, msgRef, and topic)
     * @returns a heartbeat reply message
     */
    function heartbeat(msg) {
        return [
            null,
            msg[Phx.MsgIdx.msgRef],
            "phoenix",
            "phx_reply",
            {
                status: "ok",
                response: {},
            },
        ];
    }
    PhxReply.heartbeat = heartbeat;
    /**
     * serialize serializes a reply message to a string.
     * @param msg the message to serialize
     * @returns a string representation of the message
     */
    function serialize(msg) {
        return JSON.stringify(msg);
    }
    PhxReply.serialize = serialize;
})(PhxReply || (PhxReply = {}));

async function handleEvent(ctx, payload) {
    const { type, event, cid } = payload;
    let value = {};
    switch (type) {
        case "click":
        case "keyup":
        case "keydown":
        case "blur":
        case "focus":
        case "hook":
            value = payload.value;
            break;
        case "form":
            // parse payload into form data
            const pl = payload;
            value = Object.fromEntries(new URLSearchParams(pl.value));
            // if _csrf_token is set, ensure it is the same as session csrf token
            if (value.hasOwnProperty("_csrf_token")) {
                if (value._csrf_token !== ctx.csrfToken) {
                    throw new Error("Mismatched CSRF token");
                }
            }
            else {
                console.warn(`Warning: form event data missing _csrf_token value. \nConsider passing it in via a hidden input named "_csrf_token".  \nYou can get the value from the LiveViewMeta object passed the render method. \n`);
            }
            // parse uploads into uploadConfig for given name
            if (pl.uploads) {
                const { uploads } = pl;
                // get _target from form data
                const target = value["_target"];
                if (target && ctx.uploadConfigs.hasOwnProperty(target)) {
                    const config = ctx.uploadConfigs[target];
                    // check config ref matches uploads key
                    if (uploads.hasOwnProperty(config.ref)) {
                        const entries = uploads[config.ref].map((upload) => {
                            return new UploadEntry(upload, config);
                        });
                        config.setEntries(entries);
                    }
                }
            }
            break;
        default:
            throw new Error(`Unknown event type: ${type}`);
    }
    // if the payload has a cid, then this event's target is a `LiveComponent`
    // TODO - reimplement LiveComponent
    // for "lv:clear-flash" events we don't need to call handleEvent
    if (event === "lv:clear-flash") {
        const clearFlashPayload = payload;
        const key = clearFlashPayload.value.key;
        ctx.clearFlash(key);
    }
    else {
        if (typeof value === "string" || typeof value === "number") {
            value = { value };
        }
        await ctx.liveView.handleEvent({ type: event, ...value }, ctx.socket);
    }
    return await ctx.liveView.render(ctx.socket.context, ctx.defaultLiveViewMeta());
}

async function onUploadBinary(ctx, msg, fileSystem) {
    // generate a random temp file path
    const randomTempFilePath = fileSystem.tempPath(nanoid());
    const [joinRef, msgRef, topic, event, payload] = msg;
    fileSystem.writeTempFile(randomTempFilePath, payload);
    // console.log("wrote temp file", randomTempFilePath, header.length, `"${header.toString()}"`);
    // split topic to get uploadRef
    const ref = topic.split(":")[1];
    // get activeUploadConfig by this.activeUploadRef
    const activeUploadConfig = Object.values(ctx.uploadConfigs).find((c) => c.ref === ctx.activeUploadRef);
    if (activeUploadConfig) {
        // find entry from topic ref
        const entry = activeUploadConfig.entries.find((e) => e.ref === ref);
        if (!entry) {
            // istanbul ignore next
            throw Error(`Could not find entry for ref ${ref} in uploadConfig ${JSON.stringify(activeUploadConfig)}`);
        }
        // use fileSystemAdaptor to get path to a temp file
        const entryTempFilePath = fileSystem.tempPath(entry.uuid);
        // create or append to entry's temp file
        fileSystem.createOrAppendFile(entryTempFilePath, randomTempFilePath);
        // tell the entry where it's temp file is
        entry.setTempFile(entryTempFilePath);
    }
    let returnDiff = true;
    Object.keys(ctx.uploadConfigs).forEach((key) => {
        const config = ctx.uploadConfigs[key];
        // match upload config on the active upload ref
        if (config.ref === ctx.activeUploadRef) {
            // check if ref progress > 0
            config.entries.forEach((entry) => {
                if (entry.ref === ref) {
                    // only return diff if entry ref progress is 0
                    returnDiff = entry.progress === 0;
                }
            });
        }
    });
    const replies = [];
    if (returnDiff) {
        replies.push(PhxReply.diff(joinRef, ctx.joinId, {}));
    }
    const m = [joinRef, msgRef, topic, event, {}];
    replies.push(PhxReply.renderedReply(m, {}));
    return replies;
}
async function onProgressUpload(ctx, payload) {
    const { ref, entry_ref, progress } = payload;
    // console.log("onProgressUpload handle", ref, entry_ref, progress);
    // iterate through uploadConfigs and find the one that matches the ref
    const uploadConfig = Object.values(ctx.uploadConfigs).find((config) => config.ref === ref);
    if (uploadConfig) {
        uploadConfig.entries = uploadConfig.entries.map((entry) => {
            if (entry.ref === entry_ref) {
                entry.updateProgress(progress);
            }
            return entry;
        });
        ctx.uploadConfigs[uploadConfig.name] = uploadConfig;
    }
    else {
        // istanbul ignore next
        console.error("Received progress upload but could not find upload config for ref", ref);
    }
    return await ctx.liveView.render(ctx.socket.context, ctx.defaultLiveViewMeta());
}
async function onAllowUpload(ctx, payload) {
    const { ref, entries } = payload;
    ctx.activeUploadRef = ref;
    const uc = Object.values(ctx.uploadConfigs).find((c) => c.ref === ref);
    if (!uc) {
        // istanbul ignore next
        throw Error(`Could not find upload config for ref ${ref}`);
    }
    const entriesReply = {
        ref,
    };
    entries.forEach(async (entry) => {
        try {
            // this reply ends up been the "token" for the onPhxJoinUpload
            entriesReply[entry.ref] = JSON.stringify(entry);
        }
        catch (e) {
            // istanbul ignore next
            console.error("Error serializing entry", e);
        }
    });
    const view = await ctx.liveView.render(ctx.socket.context, ctx.defaultLiveViewMeta());
    return {
        entries: entriesReply,
        config: uc,
        view,
    };
    // // wrap in root template if there is one
    // view = await this.maybeWrapInRootTemplate(view);
    // // diff the new view with the old view
    // const newParts = view.partsTree(true);
    // let diff = deepDiff(this._parts!, newParts);
    // // reset parts to new parts
    // this._parts = newParts;
    // // add the rest of the things
    // diff = this.maybeAddPageTitleToParts(diff);
    // diff = this.maybeAddEventsToParts(diff);
    // const replyPayload = {
    //   response: {
    //     diff,
    //     config,
    //     entries: entriesReply,
    //   },
    //   status: "ok",
    // };
    // this.sendPhxReply(newPhxReply(message, replyPayload));
    // // maybe send any queued info messages
    // await this.maybeSendInfos();
    // // remove temp data
    // this.socket.updateContextWithTempAssigns();
}

maybeAddStructuredClone();
class WsHandlerContext {
    #liveView;
    #socket;
    #joinId;
    #csrfToken;
    #pageTitle;
    #pageTitleChanged = false;
    #flash;
    #sessionData;
    url;
    pushEvents = [];
    activeUploadRef = null;
    uploadConfigs = {};
    parts = {};
    constructor(liveView, socket, joinId, csrfToken, url, sessionData, flash) {
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
    set pageTitle(newTitle) {
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
    defaultLiveViewMeta() {
        return {
            csrfToken: this.csrfToken,
            live_component: async (liveComponent, params) => {
                // TODO - reimplement live components
                throw new Error("Not implemented");
            },
            url: this.url,
            uploads: this.uploadConfigs,
        };
    }
    clearFlash(key) {
        return this.#flash.clearFlash(this.#sessionData, key);
    }
}
class WsHandler {
    #ws;
    #config;
    #ctx;
    #activeMsg = false;
    #msgQueue = [];
    #subscriptionIds = {};
    #hbInterval;
    #lastHB;
    constructor(ws, config) {
        this.#config = config;
        this.#ws = ws;
        this.#ws.subscribeToMessages(async (data, isBinary) => {
            try {
                if (isBinary) {
                    await this.handleMsg(Phx.parseBinary(data));
                    return;
                }
                await this.handleMsg(Phx.parse(data.toString()));
            }
            catch (e) {
                console.error("error parsing Phx message", e);
            }
        });
        this.#ws.subscribeToClose(() => this.close);
    }
    async handleMsg(msg) {
        if (this.#config.debug) {
            try {
                this.#config.debug(JSON.stringify(msg));
            }
            catch (e) {
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
                        const payload = msg[Phx.MsgIdx.payload];
                        // figure out if we are using url or redirect for join URL
                        const { url: urlString, redirect: redirectString } = payload;
                        if (urlString === undefined && redirectString === undefined) {
                            throw new Error("Join message must have either a url or redirect property");
                        }
                        // checked one of these was defined in MessageRouter
                        const url = new URL((urlString || redirectString));
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
                            console.error("Rejecting join due to mismatched csrfTokens", sessionData._csrf_token, payloadParams._csrf_token);
                            return;
                        }
                        // success! now let's initialize this liveview
                        const socket = this.newLiveViewSocket(topic, url);
                        this.#ctx = new WsHandlerContext(liveView, socket, topic, // aka joinId
                        payloadParams._csrf_token, url, sessionData, this.#config.flashAdaptor);
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
                    }
                    else if (topic.startsWith("lvu:")) {
                        // const payload = msg[Phx.MsgIdx.payload] as Phx.JoinUploadPayload;
                        // perhaps we should check this token matches entries send in the "allow_upload" event?
                        // const { token } = payload;
                        // send ACK
                        // TODO? send more than ack? what?
                        this.send(PhxReply.renderedReply(msg, {}));
                    }
                    else {
                        // istanbul ignore next
                        throw new Error(`Unknown phx_join prefix: ${topic}`);
                    }
                    break;
                case "event":
                    try {
                        const payload = msg[Phx.MsgIdx.payload];
                        const view = await handleEvent(this.#ctx, payload);
                        const diff = await this.viewToDiff(view);
                        this.send(PhxReply.diffReply(msg, diff));
                        this.cleanupPostReply();
                    }
                    catch (e) {
                        console.error("error handling event", e);
                    }
                    break;
                case "info":
                    try {
                        const payload = msg[Phx.MsgIdx.payload];
                        // lifecycle handleInfo => render
                        await this.#ctx.liveView.handleInfo(payload, this.#ctx.socket);
                        const view = await this.#ctx.liveView.render(this.#ctx.socket.context, this.#ctx.defaultLiveViewMeta());
                        const diff = await this.viewToDiff(view);
                        this.send(PhxReply.diff(null, this.#ctx.joinId, diff));
                        this.cleanupPostReply();
                    }
                    catch (e) {
                        /* istanbul ignore next */
                        console.error(`Error sending internal info`, e);
                    }
                    break;
                case "live_redirect":
                    const payload = msg[Phx.MsgIdx.payload];
                    const { to } = payload;
                    // to is relative so need to provide the urlBase determined on initial join
                    this.#ctx.url = new URL(to, this.#ctx.url);
                    // let the `LiveView` udpate its context based on the new url
                    await this.#ctx.liveView.handleParams(this.#ctx.url, this.#ctx.socket);
                    // send the message on to the client
                    this.send(msg);
                    break;
                case "live_patch":
                    // two cases of live_patch: server-side (pushPatch) or client-side (click on link)
                    try {
                        const payload = msg[Phx.MsgIdx.payload];
                        if (payload.hasOwnProperty("url")) {
                            // case 1: client-side live_patch
                            const url = new URL(payload.url);
                            this.#ctx.url = url;
                            await this.#ctx.liveView.handleParams(url, this.#ctx.socket);
                            const view = await this.#ctx.liveView.render(this.#ctx.socket.context, this.#ctx.defaultLiveViewMeta());
                            const diff = await this.viewToDiff(view);
                            this.send(PhxReply.diffReply(msg, diff));
                            this.cleanupPostReply();
                        }
                        else {
                            // case 2: server-side live_patch
                            const { to } = payload;
                            // to is relative so need to provide the urlBase determined on initial join
                            this.#ctx.url = new URL(to, this.#ctx.url);
                            // let the `LiveView` udpate its context based on the new url
                            await this.#ctx.liveView.handleParams(this.#ctx.url, this.#ctx.socket);
                            // send the message on to the client
                            this.send(msg);
                        }
                    }
                    catch (e) {
                        /* istanbul ignore next */
                        console.error("Error handling live_patch", e);
                    }
                    break;
                // Start File Upload Events
                case "allow_upload":
                    try {
                        const payload = msg[Phx.MsgIdx.payload];
                        const { view, config, entries } = await onAllowUpload(this.#ctx, payload);
                        const diff = await this.viewToDiff(view);
                        this.send(PhxReply.allowUploadReply(msg, diff, config, entries));
                    }
                    catch (e) {
                        console.error("error handling allow_upload", e);
                    }
                    break;
                case "progress":
                    try {
                        const payload = msg[Phx.MsgIdx.payload];
                        const view = await onProgressUpload(this.#ctx, payload);
                        const diff = await this.viewToDiff(view);
                        this.send(PhxReply.diffReply(msg, diff));
                        this.cleanupPostReply();
                    }
                    catch (e) {
                        console.error("error handling progress", e);
                    }
                    break;
                case "chunk":
                    try {
                        const replies = await onUploadBinary(this.#ctx, msg, this.#config.fileSysAdaptor);
                        for (const reply of replies) {
                            this.send(reply);
                        }
                    }
                    catch (e) {
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
                    }
                    catch (e) {
                        console.error("error stopping heartbeat", e);
                    }
                    try {
                        // shutdown the liveview
                        if (this.#ctx) {
                            await this.#ctx.liveView.shutdown(this.#ctx.joinId, this.#ctx);
                            // clear out the context
                            this.#ctx = undefined;
                        }
                    }
                    catch (e) {
                        console.error("error shutting down liveview:" + this.#ctx?.joinId, e);
                    }
                    try {
                        // unsubscribe from PubSubs
                        Object.entries(this.#subscriptionIds).forEach(async ([topic, subId]) => {
                            await this.#config.pubSub.unsubscribe(topic, subId);
                        });
                    }
                    catch (e) {
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
        }
        catch (e) {
            this.maybeHandleError(e);
        }
    }
    async close() {
        // redirect this through handleMsg after adding the joinId
        const joinId = this.#ctx?.joinId ?? "unknown";
        this.handleMsg([null, null, joinId, "phx_leave", null]);
    }
    send(reply) {
        try {
            this.#ws.send(PhxReply.serialize(reply), this.maybeHandleError);
        }
        catch (e) {
            this.maybeHandleError(e);
        }
    }
    maybeHandleError(err) {
        if (err && this.#config.onError) {
            this.#config.onError(err);
        }
    }
    async cleanupPostReply() {
        // do post-send lifecycle step
        this.#ctx.socket.updateContextWithTempAssigns();
    }
    async viewToDiff(view) {
        // wrap in root template if there is one
        view = await this.maybeWrapView(view);
        // diff the new view with the old view
        const newParts = view.partsTree(true);
        let diff = deepDiff(this.#ctx.parts, newParts);
        // store newParts for future diffs
        this.#ctx.parts = newParts;
        // TODO
        diff = this.maybeAddEventsToParts(diff);
        return this.maybeAddTitleToView(diff);
    }
    async viewToRendered(view) {
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
        this.#ctx.parts = parts;
        return parts;
    }
    maybeAddEventsToParts(parts) {
        if (this.#ctx.pushEvents.length > 0) {
            const events = structuredClone(this.#ctx.pushEvents);
            this.#ctx.pushEvents = []; // reset
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
    maybeAddTitleToView(parts) {
        if (this.#ctx.hasPageTitleChanged) {
            const t = this.#ctx.pageTitle; // resets changed flag
            parts = {
                ...parts,
                t,
            };
        }
        return parts;
    }
    async maybeWrapView(view) {
        if (this.#config.wrapperTemplate) {
            view = await this.#config.wrapperTemplate(this.#ctx.sessionData, safe(view));
        }
        return view;
    }
    // LiveViewMeta
    newLiveViewMeta() {
        return {
            csrfToken: this.#ctx.csrfToken,
            // live_component: async <TContext extends LiveContext = AnyLiveContext>(
            //   liveComponent: LiveComponent<TContext>,
            //   params?: Partial<TContext & { id: string | number }>
            // ): Promise<LiveViewTemplate> => {
            //   return await this.liveComponentProcessor<TContext>(liveComponent, params);
            // },
            url: this.#ctx.url,
            uploads: this.#ctx.uploadConfigs,
        };
    }
    async pushNav(navEvent, path, params, replaceHistory = false) {
        try {
            // construct the outgoing message
            const to = params ? `${path}?${params}` : path;
            const kind = replaceHistory ? "replace" : "push";
            const msg = [
                null,
                null,
                this.#ctx.joinId,
                navEvent,
                { kind, to },
            ];
            // send this back through handleMsg
            this.handleMsg(msg);
        }
        catch (e) {
            /* istanbul ignore next */
            console.error(`Error handling ${navEvent}`, e);
        }
    }
    // liveview socket methods
    // TODO move this to context?
    newLiveViewSocket(joinId, url) {
        return new WsLiveViewSocket(
        // id
        joinId, 
        // url
        url, 
        // pageTitleCallback
        (newTitle) => {
            this.#ctx.pageTitle = newTitle;
        }, 
        // pushEventCallback
        (pushEvent) => {
            this.#ctx.pushEvents.push(pushEvent);
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
            await this.#config.flashAdaptor.putFlash(this.#ctx.sessionData, key, value);
        }, 
        // sendInfoCallback
        (info) => {
            // info can be a string or an object so check it
            // if it's a string, we need to convert it to a LiveInfo object
            if (typeof info === "string") {
                info = { type: info };
            }
            this.handleMsg([null, null, this.#ctx.joinId, "info", info]);
        }, 
        // subscribeCallback
        async (topic) => {
            const subId = await this.#config.pubSub.subscribe(topic, (info) => {
                // dispatch as an "info" message
                this.handleMsg([null, null, this.#ctx.joinId, "info", info]);
            });
            this.#subscriptionIds[topic] = subId;
        }, 
        // allowUploadCallback
        async (name, options) => {
            this.#ctx.uploadConfigs[name] = new UploadConfig(name, options);
        }, 
        // cancelUploadCallback
        async (configName, ref) => {
            const uploadConfig = this.#ctx.uploadConfigs[configName];
            if (uploadConfig) {
                uploadConfig.removeEntry(ref);
            }
            else {
                // istanbul ignore next
                console.warn(`Upload config ${configName} not found for cancelUpload`);
            }
        }, 
        // consumeUploadedEntriesCallback
        async (configName, fn) => {
            const uploadConfig = this.#ctx.uploadConfigs[configName];
            if (uploadConfig) {
                const inProgress = uploadConfig.entries.some((entry) => !entry.done);
                if (inProgress) {
                    throw new Error("Cannot consume entries while uploads are still in progress");
                }
                // noting is in progress so we can consume
                const entries = uploadConfig.consumeEntries();
                return await Promise.all(entries.map(async (entry) => await fn({ path: entry.getTempFile(), fileSystem: this.#config.fileSysAdaptor }, entry)));
            }
            console.warn(`Upload config ${configName} not found for consumeUploadedEntries`);
            return [];
        }, 
        // uploadedEntriesCallback
        async (configName) => {
            const completed = [];
            const inProgress = [];
            const uploadConfig = this.#ctx.uploadConfigs[configName];
            if (uploadConfig) {
                uploadConfig.entries.forEach((entry) => {
                    if (entry.done) {
                        completed.push(entry);
                    }
                    else {
                        inProgress.push(entry);
                    }
                });
            }
            else {
                // istanbul ignore next
                console.warn(`Upload config ${configName} not found for uploadedEntries`);
            }
            return {
                completed,
                inProgress,
            };
        });
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
    fileSystemAdaptor;
    liveViewRootTemplate;
    constructor(router, pubSub, flashAdaptor, serDe, filesAdapter, liveViewRootTemplate) {
        this.router = router;
        this.pubSub = pubSub;
        this.flashAdaptor = flashAdaptor;
        this.serDe = serDe;
        this.fileSystemAdaptor = filesAdapter;
        this.liveViewRootTemplate = liveViewRootTemplate;
    }
    /**
     * Handles incoming websocket messages including binary and text messages and manages
     * routing those messages to the correct LiveViewManager.
     * @param connectionId the connection id of the websocket connection
     * @param data text or binary message data
     * @param wsAdaptor an instance of the websocket adaptor used to send messages to the client
     * @param isBinary whether the message is a binary message
     */
    async onMessage(connectionId, data, wsAdaptor, isBinary) {
        if (isBinary) {
            // assume binary data is an "upload_binary" type message"
            await this.pubSub.broadcast(connectionId, {
                type: "upload_binary",
                message: { data },
            });
            return;
        }
        // not binary so parse json to phx message
        const rawPhxMessage = JSON.parse(data.toString());
        // rawPhxMessage must be an array with 5 elements
        if (typeof rawPhxMessage === "object" && Array.isArray(rawPhxMessage) && rawPhxMessage.length === 5) {
            const event = rawPhxMessage[PhxProtocol.event];
            const topic = rawPhxMessage[PhxProtocol.topic];
            try {
                switch (event) {
                    case "phx_join":
                        // phx_join event used for both LiveView joins and LiveUpload joins
                        // check prefix of topic to determine if LiveView (lv:*) or LiveViewUpload (lvu:*)
                        if (topic.startsWith("lv:")) {
                            await this.onPhxJoin(connectionId, rawPhxMessage, wsAdaptor);
                        }
                        else if (topic.startsWith("lvu:")) {
                            // since we don't have the lv topic id, use the connectionId to broadcast to the component manager
                            await this.pubSub.broadcast(connectionId, {
                                type: "phx_join_upload",
                                message: rawPhxMessage,
                            });
                        }
                        else {
                            // istanbul ignore next
                            throw new Error(`Unknown phx_join prefix: ${topic}`);
                        }
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
                    case "allow_upload":
                    case "progress":
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
        // get the url or redirect url from the message payload
        const payload = message[PhxProtocol.payload];
        const { url: urlString, redirect: redirectString } = payload;
        const joinUrl = urlString || redirectString;
        if (!joinUrl) {
            throw Error(`no url or redirect in join message ${message}`);
        }
        const url = new URL(joinUrl);
        // route to the correct component based on the resolved url (pathname)
        const matchResult = matchRoute(this.router, url.pathname);
        if (!matchResult) {
            throw Error(`no LiveView found for ${url}`);
        }
        const [liveView, mr] = matchResult;
        // create a LiveViewManager for this connection / LiveView
        const liveViewManager = new LiveViewManager(liveView, connectionId, wsAdaptor, this.serDe, this.pubSub, this.flashAdaptor, this.fileSystemAdaptor, mr.params, this.liveViewRootTemplate);
        await liveViewManager.handleJoin(message);
    }
}

export { BaseLiveComponent, BaseLiveView, HtmlSafeString, HttpLiveComponentSocket, HttpLiveViewSocket, JS, LiveViewManager, Phx, SessionFlashAdaptor, SingleProcessPubSub, UploadConfig, UploadEntry, WsHandler, WsHandlerContext, WsLiveComponentSocket, WsLiveViewSocket, WsMessageRouter, createLiveComponent, createLiveView, deepDiff, diffArrays, diffArrays2, error_tag, escapehtml, form_for, handleHttpLiveView, html, join, live_file_input, live_img_preview, live_patch, live_title_tag, matchRoute, mime, newChangesetFactory, nodeHttpFetch, options_for_select, safe, submit, telephone_input, text_input };
