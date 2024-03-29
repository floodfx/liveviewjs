/// <reference types="node" />
import { FileSystemAdaptor, SerDe, SessionData, Subscriber, Publisher, SubscriberFunction, LiveViewServerAdaptor, LiveViewRouter, LiveViewHtmlPageTemplate, LiveTitleOptions, PubSub, FlashAdaptor, LiveViewWrapperTemplate, WsHandler, WsAdaptor, WsMsgListener, WsCloseListener } from 'liveviewjs';
import { RedisClientOptions } from 'redis';
import { RequestHandler } from 'express';
import WebSocket, { WebSocket as WebSocket$1 } from 'ws';

declare class NodeFileSystemAdatptor implements FileSystemAdaptor {
    tempPath(lastPathPart: string): string;
    writeTempFile(dest: string, data: Buffer): void;
    createOrAppendFile(dest: string, src: string): void;
}

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

interface NodeExpressLiveViewServerOptions {
    serDe?: SerDe;
    pubSub?: PubSub;
    flashAdaptor?: FlashAdaptor;
    fileSystemAdaptor?: FileSystemAdaptor;
    wrapperTemplate?: LiveViewWrapperTemplate;
    onError?: (err: any) => void;
    debug?: (msg: string) => void;
}
type WsRequestHandler = (ws: WebSocket.WebSocket) => WsHandler;
declare class NodeExpressLiveViewServer implements LiveViewServerAdaptor<RequestHandler, WsRequestHandler> {
    #private;
    private router;
    private serDe;
    private flashAdapter;
    private pubSub;
    private fileSystem;
    private htmlPageTemplate;
    private liveTitleOptions;
    private wrapperTemplate?;
    constructor(router: LiveViewRouter, htmlPageTemplate: LiveViewHtmlPageTemplate, signingSecret: string, liveTitleOptions: LiveTitleOptions, options?: NodeExpressLiveViewServerOptions);
    get wsMiddleware(): WsRequestHandler;
    get httpMiddleware(): RequestHandler;
}

/**
 * Node specific adaptor to enabled the WsMessageRouter to send messages back
 * to the client via WebSockets.
 */
declare class NodeWsAdaptor implements WsAdaptor {
    #private;
    constructor(ws: WebSocket$1);
    subscribeToMessages(msgListener: WsMsgListener): void | Promise<void>;
    subscribeToClose(closeListener: WsCloseListener): void | Promise<void>;
    send(message: string, errorHandler?: (err: any) => void): void;
    isClosed(): boolean;
}

export { NodeExpressLiveViewServer, NodeFileSystemAdatptor, NodeJwtSerDe, NodeWsAdaptor, RedisPubSub };
