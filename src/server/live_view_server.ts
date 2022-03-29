import express, { ErrorRequestHandler, RequestHandler } from "express";
import session, { MemoryStore } from "express-session";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import path from "path";
import WebSocket from "ws";
import { LiveView, LiveViewRouter, live_title_tag } from ".";
import { NodeJwtSerDe } from "./adaptor/express";
import {
  HttpLiveComponentSocket,
  LiveComponent,
  LiveComponentContext,
  LiveViewContext,
  LiveViewTemplate,
} from "./component";
import { Flash } from "./component/flash";
import { PubSub, SingleProcessPubSub } from "./pubsub";
import { SessionData } from "./session";
import { HttpLiveViewSocket } from "./socket/live_socket";
import { MessageRouter } from "./socket/message_router";
import { WsAdaptor } from "./socket/wsAdaptor";
import { html, HtmlSafeString, safe } from "./templates";
import { live_flash } from "./templates/helpers/live_flash";
import { PageTitleDefaults } from "./templates/helpers/page_title";

// extend / define session interface
declare module "express-session" {
  interface SessionData {
    csrfToken: string;
    flash: Flash;
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

class ExpressWsAdaptor implements WsAdaptor {
  private ws: WebSocket;
  constructor(ws: WebSocket) {
    this.ws = ws;
  }
  send(message: string, errorHandler?: (err: any) => void): void {
    this.ws.send(message, errorHandler);
  }
}

export class LiveViewServer {
  private port: number = 4444;
  private rootView: string = "root.html.ejs";
  // defaults to path relative to this module in /node_modules/
  private publicPath: string = path.join(__dirname, "..", "client");
  private viewsPath: string[];
  private signingSecret: string;
  private sessionStore: session.Store = new MemoryStore();
  private _router: LiveViewRouter = {};
  private messageRouter: MessageRouter;
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
    this.messageRouter = new MessageRouter(
      new NodeJwtSerDe(this.signingSecret),
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
        const wsAdaptor = new ExpressWsAdaptor(socket);
        await this.messageRouter.onMessage(
          wsAdaptor,
          message.toString(),
          this._router,
          connectionId,
          this.signingSecret
        );
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
    app.use(async (req, res, next) => {
      try {
        const liveview = req.path;

        // new LiveViewId per HTTP requess?
        const liveViewId = nanoid();

        // look up component for route
        const component = this._router[liveview];
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

        if (!req.session.flash) {
          // add flash if need be
          req.session.flash = new Flash();
        } else {
          // otherwise take plain object and make Flash
          req.session.flash = new Flash(Object.entries(req.session.flash || {}));
        }

        // http  socket
        const liveViewSocket = new HttpLiveViewSocket<LiveViewContext>(liveViewId);

        // mount
        await component.mount({ _csrf_token: req.session.csrfToken, _mounts: -1 }, { ...req.session }, liveViewSocket);

        // check for redirects in mount
        if (liveViewSocket.redirect) {
          res.redirect(liveViewSocket.redirect.to);
          return;
        }

        // handle_params
        await component.handleParams(req.query, req.url, liveViewSocket);

        // check for redirects in handle params
        if (liveViewSocket.redirect) {
          const { to } = liveViewSocket.redirect;
          res.redirect(to);
          return;
        }

        // pass LiveViewContext and LiveViewMeta to render
        const lvContext = liveViewSocket.context;
        // const liveViewMeta = new HttpLiveViewMeta(liveViewId, req.session.csrfToken);

        let myself = 1;
        const view = await component.render(lvContext, {
          csrfToken: req.session.csrfToken,
          async live_component(
            liveComponent: LiveComponent<LiveComponentContext>,
            params?: Partial<LiveComponentContext & { id: string | number }>
          ): Promise<LiveViewTemplate> {
            // params may be empty
            params = params ?? {};
            delete params.id; // remove id before passing to socket

            // create live component socket
            const lcSocket = new HttpLiveComponentSocket<LiveComponentContext>(
              liveViewId,
              params as unknown as LiveComponentContext
            );

            // update socket with params
            lcSocket.assign(params);

            // run lifecycle
            await liveComponent.mount(lcSocket);
            await liveComponent.update(lcSocket);

            // render view with context
            const lcContext = lcSocket.context;
            const newView = await liveComponent.render(lcContext, { myself: myself });
            myself++;
            // since http request is stateless send back the LiveViewTemplate
            return newView;
          },
        });

        const session = jwt.sign({ ...req.session }, this.signingSecret);
        const statics = jwt.sign(JSON.stringify(view.statics), this.signingSecret);

        let live_inner_content: HtmlSafeString = safe(view);
        if (this.liveViewRootTemplate) {
          live_inner_content = this.liveViewRootTemplate(req.session as SessionData, safe(view));
        }

        const root_inner_content = html`
          <div data-phx-main="true" data-phx-session="${session}" data-phx-static="${statics}" id="phx-${liveViewId}">
            ${safe(live_inner_content)}
          </div>
        `;

        // render the view with all the data
        res.render(this.rootView, {
          page_title: this.pageTitleDefaults?.title ?? "",
          page_title_prefix: this.pageTitleDefaults?.prefix,
          page_title_suffix: this.pageTitleDefaults?.suffix,
          csrf_meta_tag: req.session.csrfToken,
          inner_content: root_inner_content,
        });
      } catch (e) {
        console.error(e);
        next(e);
      }
    });

    return app;
  }
}
