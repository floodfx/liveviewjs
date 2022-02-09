import { LiveViewComponent, LiveViewRouter, LiveViewSocket } from "./types";
import WebSocket from 'ws';
import http, { Server, createServer } from 'http';
import express from "express";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import session, { MemoryStore, SessionData } from "express-session";
import path from "path";
import { MessageRouter } from "./socket/message_router";


// extend / define session interface
declare module 'express-session' {
  interface SessionData {
    csrfToken: string;
  }
}

export interface LiveViewServerOptions {
  port: number;
  rootView: string;
  viewsPath: string;
  signingSecret: string;
  sessionStore: session.Store;
}

const MODULE_VIEWS_PATH = path.join(__dirname, "web", "views");

export class LiveViewServer {
  private port: number = 4444;
  private rootView: string = "index.html.ejs";
  private viewsPath: string[];
  private signingSecret: string;
  private sessionStore: session.Store = new MemoryStore();

  private _router: LiveViewRouter = {};
  private messageRouter = new MessageRouter()
  private _isStarted = false;
  readonly httpServer: Server;
  readonly socketServer: WebSocket.Server;
  expressApp: express.Application;

  constructor(options: Partial<Omit<LiveViewServerOptions, "signingSecret">> & { signingSecret: string }) {
    this.port = options.port ?? this.port;
    this.rootView = options.rootView ?? this.rootView;
    this.viewsPath = options.viewsPath ? [options.viewsPath, MODULE_VIEWS_PATH] : [MODULE_VIEWS_PATH];
    this.sessionStore = options.sessionStore ?? this.sessionStore;
    this.signingSecret = options.signingSecret;
    this.expressApp = this.buildExpressApp();
    this.httpServer = new Server();
    this.socketServer = new WebSocket.Server({
      server: this.httpServer
    });
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
      socket.on('message', message => {
        this.messageRouter.onMessage(socket, message, this._router, connectionId, this.signingSecret);
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

    const publicPath = path.join(__dirname, "..", "client");

    app.use(express.static(publicPath))

    app.set('view engine', 'ejs');
    app.set("views", this.viewsPath)

    app.use(session({
      secret: this.signingSecret,
      resave: false,
      rolling: true,
      saveUninitialized: true,
      cookie: { secure: process.env.NODE_ENV === "production" },
      store: this.sessionStore,
    }))



    app.get('/:liveview', (req, res) => {
      const liveview = req.params.liveview;

      // new LiveViewId per HTTP requess?
      const liveViewId = nanoid(); // TODO allow option for id generator?
      const liveViewSocket: LiveViewSocket<unknown> = {
        id: liveViewId,
        connected: false, // ws socket not connected on http request
        context: {},
        sendInternal: () => { },
        repeat: () => { },
      }

      // look up component for route
      const component = this._router[`/${liveview}`];
      if (!component) {
        // TODO which is better 404 or just call next()?
        // next();
        // return;
        res.status(404).send("Not found");
        return;
      }

      // lookup / gen csrf token for this session
      if (!req.session.csrfToken) {
        req.session.csrfToken = nanoid();
      }

      const jwtPayload: Omit<SessionData, "cookie"> = {
        csrfToken: req.session.csrfToken,
      }

      // mount and render component if found
      const ctx = component.mount({ _csrf_token: req.session.csrfToken, _mounts: -1 }, {}, liveViewSocket);
      const view = component.render(ctx);

      // render the view with all the data
      res.render("root.html.ejs", {
        page_title: "Live View",
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