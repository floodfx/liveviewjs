
/// <reference types="./liveview.d.ts" />
import fs from 'fs';
import os from 'os';
import path from 'path';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createClient } from 'redis';
import { SessionFlashAdaptor, SingleProcessPubSub, WsHandler, matchRoute, handleHttpLiveView } from 'liveviewjs';
import { nanoid } from 'nanoid';

class NodeFileSystemAdatptor {
    tempPath(lastPathPart) {
        // ensure the temp directory exists
        const tempDir = path.join(os.tmpdir(), "com.liveviewjs.files");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        return path.join(tempDir, lastPathPart);
    }
    writeTempFile(dest, data) {
        fs.writeFileSync(dest, data);
    }
    createOrAppendFile(dest, src) {
        fs.appendFileSync(dest, fs.readFileSync(src));
    }
}

/**
 * Session data serializer/deserializer for Node using JWT tokens.
 */
class NodeJwtSerDe {
    constructor(secretOrPrivateKey) {
        this.secretOrPrivateKey = secretOrPrivateKey;
    }
    deserialize(data) {
        return Promise.resolve(jwt.verify(data, this.secretOrPrivateKey));
    }
    serialize(data) {
        return Promise.resolve(jwt.sign(data, this.secretOrPrivateKey));
    }
}

/**
 * A PubSub implementation that uses Redis as a backend.
 * e.g. new RedisPubSub({ url: process.env.REDIS_URL || "redis://localhost:6379" })
 *
 * See: https://github.com/redis/node-redis#pubsub
 */
class RedisPubSub {
    constructor(options) {
        this.subscribers = {};
        this.redis = createClient(options);
        this.redis.connect();
    }
    async subscribe(topic, subscriber) {
        // create new connection for each subscription
        const redisSub = this.redis.duplicate();
        await redisSub.connect();
        // parse data to JSON before passing to subscriber
        redisSub.subscribe(topic, (data) => {
            subscriber(JSON.parse(data));
        });
        // store connection id for unsubscribe and return for caller
        const subscriptionId = crypto.randomBytes(10).toString("hex");
        this.subscribers[subscriptionId] = redisSub;
        return subscriptionId;
    }
    async broadcast(topic, data) {
        if (!this.redis.isOpen) {
            await this.redis.connect();
        }
        await this.redis.publish(topic, JSON.stringify(data));
    }
    async unsubscribe(topic, subscriberId) {
        // look up redis connection from subscriber id
        const redisSub = this.subscribers[subscriberId];
        await redisSub.unsubscribe(topic);
        // remove subscriber from subscribers
        delete this.subscribers[subscriberId];
    }
}

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

var _NodeWsAdaptor_ws;
/**
 * Node specific adaptor to enabled the WsMessageRouter to send messages back
 * to the client via WebSockets.
 */
class NodeWsAdaptor {
    constructor(ws) {
        _NodeWsAdaptor_ws.set(this, void 0);
        __classPrivateFieldSet(this, _NodeWsAdaptor_ws, ws, "f");
    }
    subscribeToMessages(msgListener) {
        __classPrivateFieldGet(this, _NodeWsAdaptor_ws, "f").on("message", msgListener);
    }
    subscribeToClose(closeListener) {
        __classPrivateFieldGet(this, _NodeWsAdaptor_ws, "f").on("close", closeListener);
    }
    send(message, errorHandler) {
        __classPrivateFieldGet(this, _NodeWsAdaptor_ws, "f").send(message, errorHandler);
    }
}
_NodeWsAdaptor_ws = new WeakMap();

var _NodeExpressLiveViewServer_config;
class NodeExpressLiveViewServer {
    constructor(router, htmlPageTemplate, liveTitleOptions, options) {
        var _a, _b, _c, _d, _e;
        _NodeExpressLiveViewServer_config.set(this, void 0);
        this.router = router;
        this.serDe = (_a = options === null || options === void 0 ? void 0 : options.serDe) !== null && _a !== void 0 ? _a : new NodeJwtSerDe((_b = options === null || options === void 0 ? void 0 : options.serDeSigningSecret) !== null && _b !== void 0 ? _b : nanoid());
        this.flashAdapter = (_c = options === null || options === void 0 ? void 0 : options.flashAdaptor) !== null && _c !== void 0 ? _c : new SessionFlashAdaptor();
        this.pubSub = (_d = options === null || options === void 0 ? void 0 : options.pubSub) !== null && _d !== void 0 ? _d : new SingleProcessPubSub();
        this.fileSystem = (_e = options === null || options === void 0 ? void 0 : options.fileSystemAdaptor) !== null && _e !== void 0 ? _e : new NodeFileSystemAdatptor();
        this.htmlPageTemplate = htmlPageTemplate;
        this.liveTitleOptions = liveTitleOptions;
        this.wrapperTemplate = options === null || options === void 0 ? void 0 : options.wrapperTemplate;
        __classPrivateFieldSet(this, _NodeExpressLiveViewServer_config, {
            router: this.router,
            fileSysAdaptor: this.fileSystem,
            serDe: this.serDe,
            wrapperTemplate: this.wrapperTemplate,
            flashAdaptor: this.flashAdapter,
            pubSub: this.pubSub,
            onError: options === null || options === void 0 ? void 0 : options.onError,
            debug: options === null || options === void 0 ? void 0 : options.debug,
        }, "f");
    }
    wsMiddleware() {
        return async (wsServer) => {
            // send websocket requests to the LiveViewJS message router
            wsServer.on("connection", (ws) => new WsHandler(new NodeWsAdaptor(ws), __classPrivateFieldGet(this, _NodeExpressLiveViewServer_config, "f")));
        };
    }
    httpMiddleware() {
        return async (req, res, next) => {
            try {
                const adaptor = new ExpressRequestAdaptor(req, res, this.serDe);
                const { getRequestPath } = adaptor;
                // look up LiveView for route
                const matchResult = matchRoute(this.router, getRequestPath());
                if (!matchResult) {
                    // no LiveView found for route so call next() to
                    // let a possible downstream route handle the request
                    next();
                    return;
                }
                const [liveview, mr] = matchResult;
                // defer to liveviewjs to handle the request
                const rootViewHtml = await handleHttpLiveView(nanoid, nanoid, liveview, adaptor, this.htmlPageTemplate, mr.params, this.liveTitleOptions, this.wrapperTemplate);
                // check if LiveView calls for a redirect and if so, do it
                if (adaptor.redirect) {
                    res.redirect(adaptor.redirect);
                    return;
                }
                // otherwise render the LiveView HTML
                res.format({
                    html: () => {
                        res.send(rootViewHtml);
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
    }
}
_NodeExpressLiveViewServer_config = new WeakMap();
/**
 * Express specific adaptor for mapping HTTP requests to LiveViews
 */
class ExpressRequestAdaptor {
    constructor(req, res, serDe) {
        this.getSessionData = () => {
            // note: req.session is added by express-session middleware
            return this.req.session;
        };
        this.getRequestParameters = () => {
            return this.req.query;
        };
        this.getRequestUrl = () => {
            // build the URL from the request
            var fullUrl = this.req.protocol + "://" + this.req.get("host") + this.req.originalUrl;
            return new URL(fullUrl);
        };
        this.getRequestPath = () => {
            return this.req.path;
        };
        this.onRedirect = (to) => {
            this.redirect = to;
        };
        this.getSerDe = () => {
            return this.serDe;
        };
        this.req = req;
        this.res = res;
        this.serDe = serDe;
    }
}

export { NodeExpressLiveViewServer, NodeFileSystemAdatptor, NodeJwtSerDe, NodeWsAdaptor, RedisPubSub };
