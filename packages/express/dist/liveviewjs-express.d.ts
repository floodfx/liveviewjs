/// <reference types="node" />
import { RedisClientOptions } from '@node-redis/client';
import { RequestHandler } from 'express';
import { FileSystemAdaptor, FlashAdaptor, LiveTitleOptions, LiveViewHtmlPageTemplate, LiveViewRouter, LiveViewServerAdaptor, LiveViewWrapperTemplate, Publisher, PubSub, SerDe, SessionData, Subscriber, SubscriberFunction, WsAdaptor, WsCloseListener, WsMsgListener } from 'liveviewjs';
import { WebSocket, WebSocketServer } from 'ws';

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
    serDeSigningSecret?: string;
    pubSub?: PubSub;
    flashAdaptor?: FlashAdaptor;
    fileSystemAdaptor?: FileSystemAdaptor;
    wrapperTemplate?: LiveViewWrapperTemplate;
}
declare class NodeExpressLiveViewServer implements LiveViewServerAdaptor<RequestHandler, (wsServer: WebSocketServer) => Promise<void>> {
    #private;
    private router;
    private serDe;
    private flashAdapter;
    private pubSub;
    private fileSystem;
    private htmlPageTemplate;
    private liveTitleOptions;
    private wrapperTemplate?;
    constructor(router: LiveViewRouter, htmlPageTemplate: LiveViewHtmlPageTemplate, liveTitleOptions: LiveTitleOptions, options?: NodeExpressLiveViewServerOptions);
    wsMiddleware(): (wsServer: WebSocketServer) => Promise<void>;
    httpMiddleware(): RequestHandler;
}

/**
 * Node specific adaptor to enabled the WsMessageRouter to send messages back
 * to the client via WebSockets.
 */
declare class NodeWsAdaptor implements WsAdaptor {
    #private;
    constructor(ws: WebSocket);
    subscribeToMessages(msgListener: WsMsgListener): void | Promise<void>;
    subscribeToClose(closeListener: WsCloseListener): void | Promise<void>;
    send(message: string, errorHandler?: (err: any) => void): void;
}

export { NodeExpressLiveViewServer, NodeFileSystemAdatptor, NodeJwtSerDe, NodeWsAdaptor, RedisPubSub };
