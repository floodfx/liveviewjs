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
console.log('MODULE_VIEWS_PATH', MODULE_VIEWS_PATH);

export class LiveViewServer {
  private port: number = 4444;
  private rootView: string = "index.html.ejs";
  private viewsPath: string[];
  private signingSecret: string = nanoid();
  private sessionStore: session.Store = new MemoryStore();

  private _router: LiveViewRouter = {};
  private messageRouter = new MessageRouter()
  expressApp: express.Application;

  constructor(options: Partial<LiveViewServerOptions>) {
    this.port = options.port ?? this.port;
    this.rootView = options.rootView ?? this.rootView;
    this.viewsPath = options.viewsPath ? [options.viewsPath, MODULE_VIEWS_PATH] : [MODULE_VIEWS_PATH];
    this.signingSecret = options.signingSecret ?? this.signingSecret;
    this.sessionStore = options.sessionStore ?? this.sessionStore;
    this.expressApp = this.buildExpressApp();
  }

  registerLiveViewRoutes(router: LiveViewRouter) {
    this._router = { ...this._router, ...router };
  }

  registerLiveViewRoute(path: string, component: LiveViewComponent<unknown, unknown>) {
    this._router[path] = component;
  }

  start() {
    console.log("starting")

    const httpServer = new Server();
    const wsServer = new WebSocket.Server({
      server: httpServer
    });

    // register express app for http requests
    httpServer.on('request', this.expressApp);

    // register websocket server ws requests
    wsServer.on('connection', socket => {

      const connectionId = nanoid();
      // handle ws messages
      socket.on('message', message => {
        this.messageRouter.onMessage(socket, message, this._router, connectionId, this.signingSecret);
      });
    });

    httpServer.listen(this.port, () => {
      console.log(`LiveView App is listening on port ${this.port} !`)
    })

  }

  private buildExpressApp() {
    const app = express();

    const publicPath = path.join(__dirname, "..", "client");
    // console.log("publicPath", publicPath);

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
      console.log("liveview", liveview);

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
        res.status(404).send("Not found");
        return;
      }

      // lookup / gen csrf token for this session
      if (!req.session.csrfToken) {
        req.session.csrfToken = nanoid();
      }

      const jwtPayload: Partial<SessionData> = {
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