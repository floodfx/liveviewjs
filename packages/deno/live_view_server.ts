import { Application, Request, nanoid, path, WebSocketServer, renderFile } from "./deps.ts";
import { LiveComponent, MessageRouter, LiveViewRouter, LiveViewSocket, LiveComponentSocket, LiveView, live_title_tag, SessionDataProvider } from "./deps_local.ts"
import { DenoJwtHelper } from "./jwt_helper.ts";

// extend / define session interface
// declare module 'express-session' {
//   interface SessionData {
//     csrfToken: string;
//   }
// }

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
  // sessionStore?: session.Store;
  pageTitleDefaults?: PageTitleDefaults;
  // middleware?: express.Handler[];
  signingSecret: string;
}

// get __dirname using import.meta.url
// https://stackoverflow.com/questions/61829367/node-js-dirname-filename-equivalent-in-deno
const __dirname = new URL('.', import.meta.url).pathname;

const MODULE_VIEWS_PATH = path.join(__dirname, "web", "views");

export class LiveViewServer {
  private port: number = 4444;
  private rootView: string = "root.html.ejs";
  // defaults to path relative to this module in /node_modules/
  private publicPath: string = path.join(__dirname, "..", "client")
  private viewsPath: string[];
  private signingSecret: string;
  // private sessionStore: session.Store = new MemoryStore();
  private _router: LiveViewRouter = {};
  private messageRouter = new MessageRouter()
  private _isStarted = false;
  private pageTitleDefaults?: PageTitleDefaults;
  // private middleware: express.Handler[] = [];

  readonly httpServer: Server;
  readonly socketServer: WebSocketServer;
  // application: Application;

  constructor(options: LiveViewServerOptions) {
    this.port = options.port ?? this.port;
    this.rootView = options.rootView ?? this.rootView;
    this.publicPath = options.publicPath ?? this.publicPath;
    this.viewsPath = options.viewsPath ? [options.viewsPath, MODULE_VIEWS_PATH] : [MODULE_VIEWS_PATH];
    // this.sessionStore = options.sessionStore ?? this.sessionStore;
    // this.middleware = options.middleware ?? this.middleware
    this.signingSecret = options.signingSecret;
    this.httpServer = new Server();
    this.socketServer = new WebSocket.Server({
      server: this.httpServer
    });
    this.pageTitleDefaults = options.pageTitleDefaults;
    this.httpApp = this.buildHttpApp();
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

  registerLiveViewRoute(path: string, component: LiveView<unknown, unknown>) {
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
    this.httpServer.on('request', this.buildHttpApp);

    // register websocket server ws requests
    this.socketServer.on('connection', socket => {

      const connectionId = nanoid();
      // handle ws messages
      socket.on('message', async message => {
        await this.messageRouter.onMessage(socket, message, this._router, connectionId, this.signingSecret);
      });
      socket.on('close', async code => {
        await this.messageRouter.onClose(code, connectionId);
      })
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


  private buildHttpApp(sessionDataProvider: SessionDataProvider<unknown & {csrfToken: string}, Request>) {
    const app = new Application();

    // empty void function
    const emptyVoid = () => {};

    // app.use(staticFiles(this.publicPath));

    // setup session
    // app.use(session({
    //   secret: this.signingSecret,
    //   resave: false,
    //   rolling: true,
    //   saveUninitialized: true,
    //   cookie: { secure: process.env.NODE_ENV === "production" },
    //   store: this.sessionStore,
    // }))

    // register middleware
    // for (const middleware of this.middleware) {
    //   app.use(middleware)
    // }

    // register live_title_tag helper
    app.use((ctx, next) => {
      ctx.state.live_title_tag = live_title_tag;
      return next();
    })

    // handle all views and look up components by path
    app.use(async (ctx, next) => {
      const { request } = ctx;
      const liveview = request.url.pathname;

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
      const component = this._router[liveview];
      if (!component) {
        // no component found for route so call next() to
        // let a possible downstream route handle the request
        next();
        return;
      }

      // extract session from req
      const session = sessionDataProvider(request);

      // mount
      const liveViewContext = await component.mount(
        {
          _csrf_token: session.csrfToken,
          _mounts: -1
        },
        { ...session },
        liveViewSocket
      );

      // TODO handle_params

      // default socket builder
      const buildLiveComponentSocket = (id: string, context: unknown): LiveComponentSocket<unknown> => {
        return {
          id,
          connected: false, // websocket is not connected on http request
          ws: undefined, // no websocke on http request
          context,
          send: () => {},
        }
      }

      // render
      let myself = 1;
      const view = await component.render(liveViewContext, {
        csrfToken: session.csrfToken,
        live_component: async(liveComponent: LiveComponent<unknown>, params?: Partial<unknown & {id: number | string}>) => {
          params = params ?? {};
          delete params.id;
          let context = await liveComponent.mount(buildLiveComponentSocket(liveViewId, params));
          context = await liveComponent.update(context, buildLiveComponentSocket(liveViewId, context));
          // no old view so just render
          const newView = await liveComponent.render(context, {myself});
          myself++;
          // since http request is stateless send back the LiveViewTemplate
          return newView;
        }
      });

      const jwt = new DenoJwtHelper(this.signingSecret);

      // render the view with all the data
      const template = await renderFile(this.rootView, {
        page_title: this.pageTitleDefaults?.title ?? "",
        page_title_prefix: this.pageTitleDefaults?.prefix,
        page_title_suffix: this.pageTitleDefaults?.suffix,
        csrf_meta_tag: session.csrfToken,
        liveViewId,
        session: await jwt.sign(session),
        statics: await jwt.sign(JSON.stringify(view.statics)),
        inner_content: view.toString(),
        live_title_tag,
      })

      // send the rendered view
      ctx.response.body = template;
    });

    return app;
  }
}

