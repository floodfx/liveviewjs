import { LiveViewComponent, LiveViewRouter } from "./types";
import WebSocket from 'ws';
import http, { Server, createServer } from 'http';
import express from "express";
import { PhxSocket } from "./socket/types";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { onMessage } from "./socket/message_router";
import session, { MemoryStore } from "express-session";
import path from "path";

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

export class LiveViewServer {
  private port: number = 4444;
  private rootView: string = "index.html.ejs";
  private viewsPath: string = path.join(__dirname, "..", "..", "src", "server", "web", "views");
  private signingSecret: string = nanoid();
  private sessionStore:session.Store = new MemoryStore();

  private _router: LiveViewRouter = {};

  private _topicToPath: { [key: string]: string } = {};

  constructor(options: Partial<LiveViewServerOptions>) {
    this.port = options.port ?? this.port;
    this.rootView = options.rootView ?? this.rootView;
    this.viewsPath = options.viewsPath ?? this.viewsPath;
    this.signingSecret = options.signingSecret ?? this.signingSecret;
    this.sessionStore = options.sessionStore ?? this.sessionStore;
  }

  registerLiveViewRoutes(router: LiveViewRouter) {
    this._router = { ...this._router, ...router };
  }

  registerLiveViewRoute(path: string, component: LiveViewComponent<any>) {
    this._router[path] = component;
  }

  start() {
    console.log("starting")
    const app = this.buildExpressApp();

    const httpServer = new Server();
    const wsServer = new WebSocket.Server({
      server: httpServer
    });

    // register express app for http requests
    httpServer.on('request', app);

    // register websocket server ws requests
    wsServer.on('connection', socket => {
      // handle ws messages
      socket.on('message', message => {
        onMessage(socket, message, this._topicToPath, this._router);
      });
    });

    httpServer.listen(this.port,  () => {
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
      cookie: {secure: process.env.NODE_ENV === "production"},
      store: this.sessionStore,
    }))



    app.get('/:liveview', (req, res) => {
      const liveview = req.params.liveview;
      console.log("liveview", liveview);

      // new LiveViewId per HTTP requess?
      const liveViewId = nanoid(); // TODO allow option for id generator?
      const phxSocket: PhxSocket = {
        id: liveViewId,
        connected: false, // ws socket not connected on http request
      }

      // look up component for route
      const component = this._router[`/${liveview}`];
      if (!component) {
        res.status(404).send("Not found");
        return;
      }

      // mount and render component if found
      const ctx = component.mount({}, {}, phxSocket);
      const view = component.render(ctx);

      // lookup / gen csrf token for this session
      if(!req.session.csrfToken) {
        req.session.csrfToken = nanoid();
      }

      // render the view with all the data
      res.render("index.html.ejs", {
        page_title: "Live View",
        csrf_meta_tag: req.session.csrfToken,
        liveViewId,
        session: jwt.sign(JSON.stringify(req.session), this.signingSecret),
        statics: jwt.sign(JSON.stringify(view.statics), this.signingSecret),
        inner_content: view.toString()
      })
    });

    return app;
  }
}