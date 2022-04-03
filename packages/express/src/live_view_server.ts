import express, { ErrorRequestHandler, RequestHandler } from "express";
import session, { MemoryStore } from "express-session";
import { Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import WebSocket from "ws";
import { configLiveViewHandler, NodeSessionSerDe } from "./httpLiveViewAdaptor";
import { NodeWsAdaptor } from "./wsLiveViewAdatpr";
import {
  LiveView,
  LiveViewRouter,
  live_title_tag,
  LiveViewContext,
  SingleProcessPubSub,
  PubSub,
  SessionData,
  WsMessageRouter,
  HtmlSafeString,
  live_flash,
  PageTitleDefaults,
} from "liveviewjs";

import { rootTemplateRenderer } from "./rootTemplateRenderer";

// extend / define session interface
declare module "express-session" {
  interface SessionData {
    csrfToken: string;
  }
}

export interface LiveViewServerOptions {
  port?: number;
  rootView?: string;
  viewsPath?: string;
  publicPath?: string;
  sessionStore?: session.Store;
  pageTitleDefaults?: PageTitleDefaults;
  middleware?: (RequestHandler | ErrorRequestHandler)[];
  liveViewRootTemplate?: (session: SessionData, inner_content: HtmlSafeString) => HtmlSafeString;
  pubSub?: PubSub;
  signingSecret: string;
}

const MODULE_VIEWS_PATH = path.join(__dirname, "web", "views");

export class LiveViewServer {
  private port: number = 4444;
  private rootView: string = "root.html.ejs";
  // defaults to path relative to this module in /node_modules/
  private publicPath: string = path.join(__dirname, "..", "client");
  private viewsPath: string[];
  private signingSecret: string;
  private sessionStore: session.Store = new MemoryStore();
  private _router: LiveViewRouter = {};
  private messageRouter: WsMessageRouter;
  private _isStarted = false;
  private pageTitleDefaults?: PageTitleDefaults;
  private middleware: (RequestHandler | ErrorRequestHandler)[] = [];
  private pubSub: PubSub;
  private liveViewRootTemplate?: (session: SessionData, inner_content: HtmlSafeString) => HtmlSafeString;

  readonly httpServer: Server;
  readonly socketServer: WebSocket.Server;
  expressApp: express.Application;

  constructor(options: LiveViewServerOptions) {
    this.port = options.port ?? this.port;
    this.rootView = options.rootView ?? this.rootView;
    this.publicPath = options.publicPath ?? this.publicPath;
    this.viewsPath = options.viewsPath ? [options.viewsPath, MODULE_VIEWS_PATH] : [MODULE_VIEWS_PATH];
    this.sessionStore = options.sessionStore ?? this.sessionStore;
    this.middleware = options.middleware ?? this.middleware;
    this.pubSub = options.pubSub ?? new SingleProcessPubSub();
    this.signingSecret = options.signingSecret;
    this.httpServer = new Server();
    this.socketServer = new WebSocket.Server({
      server: this.httpServer,
    });
    this.pageTitleDefaults = options.pageTitleDefaults;
    this.liveViewRootTemplate = options.liveViewRootTemplate;
    this.messageRouter = new WsMessageRouter(
      new NodeSessionSerDe(this.signingSecret),
      this.pubSub,
      this.liveViewRootTemplate
    );
    this.expressApp = this.buildExpressApp();
  }

  get router(): LiveViewRouter {
    return this._router;
  }

  get isStarted(): boolean {
    return this._isStarted;
  }

  registerLiveViewRoutes(router: LiveViewRouter) {
    this._router = { ...this._router, ...router };
  }

  registerLiveViewRoute(path: string, component: LiveView<LiveViewContext, unknown>) {
    this._router[path] = component;
  }

  start() {
    if (this._isStarted) {
      console.warn("LiveViewServer already started");
      return;
    } else {
      this._isStarted = true;
    }

    // register express app for http requests
    this.httpServer.on("request", this.expressApp);

    // register websocket server ws requests
    this.socketServer.on("connection", (socket) => {
      const connectionId = nanoid();
      // handle ws messages
      socket.on("message", async (message) => {
        const wsAdaptor = new NodeWsAdaptor(socket);
        await this.messageRouter.onMessage(wsAdaptor, message.toString(), this._router, connectionId);
      });
      socket.on("close", async (code) => {
        await this.messageRouter.onClose(code, connectionId);
      });
    });

    this.httpServer.listen(this.port, () => {
      console.log(`LiveView App is listening on port ${this.port} !`);
    });
  }

  shutdown() {
    if (!this._isStarted) {
      console.warn("LiveViewServer already stopped");
      return;
    } else {
      this._isStarted = false;
    }
    this.socketServer.close();
    this.httpServer.close();
  }

  private buildExpressApp() {
    const app = express();

    // empty void function
    const emptyVoid = () => {};

    app.use(express.static(this.publicPath));

    app.set("view engine", "ejs");
    app.set("views", this.viewsPath);

    // setup session
    app.use(
      session({
        secret: this.signingSecret,
        resave: false,
        rolling: true,
        saveUninitialized: true,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        },
        store: this.sessionStore,
      })
    );

    // register middleware
    for (const middleware of this.middleware) {
      app.use(middleware);
    }

    // register live_title_tag helper
    app.locals.live_title_tag = live_title_tag;
    app.locals.live_flash = live_flash;

    // handle all views and look up components by path
    app.use(
      configLiveViewHandler(
        () => this.router,
        rootTemplateRenderer,
        this.signingSecret,
        this.pageTitleDefaults,
        this.liveViewRootTemplate
      )
    );

    return app;
  }
}
