import express from "express";
import session, { MemoryStore, SessionData } from "express-session";
import { Server } from 'http';
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import path from "path";
import WebSocket from 'ws';
import { live_title_tag } from ".";
import { LiveViewComponent, LiveViewRouter, LiveViewSocket } from "./component/types";
import { MessageRouter } from "./socket/message_router";


// extend / define session interface
declare module 'express-session' {
  interface SessionData {
    csrfToken: string;
  }
}

export interface PageTitleDefaults {
  prefix?: string;
  suffix?: string;
  title: string;
}

export interface LiveViewServerOptions {
  port?: number;
  rootView?: string;
  viewsPath?: string;
  publicPath?: string;
  sessionStore?: session.Store;
  pageTitleDefaults?: PageTitleDefaults;
  middleware?: express.Handler[];
  signingSecret: string;
}

const MODULE_VIEWS_PATH = path.join(__dirname, "web", "views");

export class LiveViewServer {
  private port: number = 4444;
  private rootView: string = "root.html.ejs";
  // defaults to path relative to this module in /node_modules/
  private publicPath: string = path.join(__dirname, "..", "client")
  private viewsPath: string[];
  private signingSecret: string;
  private sessionStore: session.Store = new MemoryStore();
  private _router: LiveViewRouter = {};
  private messageRouter = new MessageRouter()
  private _isStarted = false;
  private pageTitleDefaults?: PageTitleDefaults;
  private middleware: express.Handler[] = [];

  readonly httpServer: Server;
  readonly socketServer: WebSocket.Server;
  expressApp: express.Application;

  constructor(options: LiveViewServerOptions) {
    this.port = options.port ?? this.port;
    this.rootView = options.rootView ?? this.rootView;
    this.publicPath = options.publicPath ?? this.publicPath;
    this.viewsPath = options.viewsPath ? [options.viewsPath, MODULE_VIEWS_PATH] : [MODULE_VIEWS_PATH];
    this.sessionStore = options.sessionStore ?? this.sessionStore;
    this.middleware = options.middleware ?? this.middleware
    this.signingSecret = options.signingSecret;
    this.httpServer = new Server();
    this.socketServer = new WebSocket.Server({
      server: this.httpServer
    });
    this.pageTitleDefaults = options.pageTitleDefaults;
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

  registerLiveViewRoute(path: string, component: LiveViewComponent<unknown, unknown>) {
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
    this.httpServer.on('request', this.expressApp);

    // register websocket server ws requests
    this.socketServer.on('connection', socket => {

      const connectionId = nanoid();
      // handle ws messages
      socket.on('message', async message => {
        await this.messageRouter.onMessage(socket, message, this._router, connectionId, this.signingSecret);
      });
    });

    this.httpServer.listen(this.port, () => {
      console.log(`LiveView App is listening on port ${this.port} !`)
    })

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

    app.use(express.static(this.publicPath))

    app.set('view engine', 'ejs');
    app.set("views", this.viewsPath)

    // setup session
    app.use(session({
      secret: this.signingSecret,
      resave: false,
      rolling: true,
      saveUninitialized: true,
      cookie: { secure: process.env.NODE_ENV === "production" },
      store: this.sessionStore,
    }))

    // register middleware
    for (const middleware of this.middleware) {
      app.use(middleware)
    }

    // register live_title_tag helper
    app.locals.live_title_tag = live_title_tag;

    app.get('/:liveview', async (req, res, next) => {
      const liveview = req.params.liveview;

      const emptyVoid = () => { };

      // new LiveViewId per HTTP requess?
      const liveViewId = nanoid();
      const liveViewSocket: LiveViewSocket<unknown> = {
        id: liveViewId,
        connected: false, // ws socket not connected on http request
        context: {},
        sendInternal: emptyVoid,
        repeat: emptyVoid,
        pageTitle: emptyVoid,
        subscribe: emptyVoid,
        pushPatch: emptyVoid,
      }

      // look up component for route
      const component = this._router[`/${liveview}`];
      if (!component) {
        // no component found for route so call next() to
        // let a possible downstream route handle the request
        next();
        return;
      }

      // lookup / gen csrf token for this session
      if (!req.session.csrfToken) {
        req.session.csrfToken = nanoid();
      }

      const jwtPayload: Omit<SessionData, "cookie"> = {
        ...req.session,
        csrfToken: req.session.csrfToken,
      }

      // mount and render component if found
      const ctx = await component.mount(
        { _csrf_token: req.session.csrfToken, _mounts: -1 },
        { ...jwtPayload },
        liveViewSocket
      );
      const view = component.render(ctx);

      // render the view with all the data
      res.render(this.rootView, {
        page_title: this.pageTitleDefaults?.title ?? "",
        page_title_prefix: this.pageTitleDefaults?.prefix,
        page_title_suffix: this.pageTitleDefaults?.suffix,
        csrf_meta_tag: req.session.csrfToken,
        liveViewId,
        session: jwt.sign(jwtPayload, this.signingSecret),
        statics: jwt.sign(JSON.stringify(view.statics), this.signingSecret),
        inner_content: view.toString()
      })
    });

    return app;
  }
}