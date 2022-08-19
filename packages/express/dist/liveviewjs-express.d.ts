import { SerDe, SessionData, Subscriber, Publisher, SubscriberFunction, LiveViewServerAdaptor, LiveViewRouter, PubSub, LiveViewPageRenderer, PageTitleDefaults, FlashAdaptor, FilesAdapter, LiveViewRootRenderer, WsMessageRouter, WsAdaptor } from 'liveviewjs';
import { RedisClientOptions } from '@node-redis/client';
import { RequestHandler } from 'express';
import { WebSocket } from 'ws';

/**
 * Session data serializer/deserializer for Node using JWT tokens.
 */
declare class NodeJwtSerDe implements SerDe {
    private secretOrPrivateKey;
    constructor(secretOrPrivateKey: string);
    deserialize<T extends SessionData>(data: string): Promise<T>;
    serialize<T extends SessionData>(data: T): Promise<string>;
}

/**
 * A PubSub implementation that uses Redis as a backend.
 * e.g. new RedisPubSub({ url: process.env.REDIS_URL || "redis://localhost:6379" })
 *
 * See: https://github.com/redis/node-redis#pubsub
 */
declare class RedisPubSub implements Subscriber, Publisher {
    private redis;
    private subscribers;
    constructor(options: RedisClientOptions);
    subscribe<T>(topic: string, subscriber: SubscriberFunction<T>): Promise<string>;
    broadcast<T>(topic: string, data: T): Promise<void>;
    unsubscribe(topic: string, subscriberId: string): Promise<void>;
}

declare class NodeExpressLiveViewServer implements LiveViewServerAdaptor<RequestHandler> {
    private router;
    private serDe;
    private flashAdapter;
    private pubSub;
    private filesAdapter;
    private pageRenderer;
    private pageTitleDefaults;
    private rootRenderer?;
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
    constructor(router: LiveViewRouter, serDe: SerDe, pubSub: PubSub, pageRenderer: LiveViewPageRenderer, pageTitleDefaults: PageTitleDefaults, flashAdaptor: FlashAdaptor, filesAdapter: FilesAdapter, rootRenderer?: LiveViewRootRenderer);
    httpMiddleware(): RequestHandler;
    wsRouter(): WsMessageRouter;
}

/**
 * Node specific adaptor to enabled the WsMessageRouter to send messages back
 * to the client via WebSockets.
 */
declare class NodeWsAdaptor implements WsAdaptor {
    private ws;
    constructor(ws: WebSocket);
    send(message: string, errorHandler?: (err: any) => void): void;
}

export { NodeExpressLiveViewServer, NodeJwtSerDe, NodeWsAdaptor, RedisPubSub };
