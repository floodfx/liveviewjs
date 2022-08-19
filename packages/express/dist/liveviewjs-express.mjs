
/// <reference types="./liveview.d.ts" />
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createClient } from 'redis';
import { handleHttpLiveView, WsMessageRouter } from 'liveviewjs';
import { nanoid } from 'nanoid';

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

class NodeExpressLiveViewServer {
    /**
     * Middleware for Express that determines if a request is for a LiveView
     * and if so, handles the request.  If not, it calls the next middleware.
     * @param router a function to access the LiveViewRouter which is used to match the request path against
     * @param serDe a function that embeds the LiveView HTML into to and forms a complete HTML page
     * @param pubSub the secret used by the reuest adaptor to sign the session data
     * @param pageRenderer the secret used by the reuest adaptor to sign the session data
     * @param pageTitleDefaults (optional) a PageTitleDefaults object that is fed into the rootTemplateRenderer
     * @param flashAdaptor
     * @param rootRenderer (optional) another renderer that can sit between the root template and the rendered LiveView
     */
    constructor(router, serDe, pubSub, pageRenderer, pageTitleDefaults, flashAdaptor, filesAdapter, rootRenderer) {
        this.router = router;
        this.serDe = serDe;
        this.flashAdapter = flashAdaptor;
        this.pubSub = pubSub;
        this.filesAdapter = filesAdapter;
        this.pageRenderer = pageRenderer;
        this.pageTitleDefaults = pageTitleDefaults;
        this.rootRenderer = rootRenderer;
    }
    httpMiddleware() {
        return async (req, res, next) => {
            try {
                const adaptor = new ExpressRequestAdaptor(req, res, this.serDe);
                const { getRequestPath } = adaptor;
                // look up LiveView for route
                const liveview = this.router[getRequestPath()];
                if (!liveview) {
                    // no LiveView found for route so call next() to
                    // let a possible downstream route handle the request
                    next();
                    return;
                }
                // defer to liveviewjs to handle the request
                const rootViewHtml = await handleHttpLiveView(nanoid, nanoid, liveview, adaptor, this.pageRenderer, this.pageTitleDefaults, this.rootRenderer);
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
    wsRouter() {
        return new WsMessageRouter(this.router, this.pubSub, this.flashAdapter, this.serDe, this.filesAdapter, this.rootRenderer);
    }
}
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

/**
 * Node specific adaptor to enabled the WsMessageRouter to send messages back
 * to the client via WebSockets.
 */
class NodeWsAdaptor {
    constructor(ws) {
        this.ws = ws;
    }
    send(message, errorHandler) {
        this.ws.send(message, errorHandler);
    }
}

export { NodeExpressLiveViewServer, NodeJwtSerDe, NodeWsAdaptor, RedisPubSub };
