import express, { NextFunction, Request, Response, Application } from "express";
import session, { MemoryStore } from "express-session";
import path from "path";
import {
  html,
  HtmlSafeString,
  SessionData,
  LiveViewRouter,
  live_title_tag,
  live_flash,
  WsMessageRouter,
  SingleProcessPubSub,
} from "liveviewjs";
import { routeDetails } from "./routeDetails";
import { LiveViewServer } from "./live_view_server";
import {
  AutocompleteLiveViewComponent,
  DecarbonizeLiveView,
  LicenseLiveViewComponent,
  LightLiveViewComponent,
  SearchLiveViewComponent,
  PaginateLiveViewComponent,
  SalesDashboardLiveViewComponent,
  ServersLiveViewComponent,
  SortLiveViewComponent,
  VolunteerComponent,
} from "@liveviewjs/examples";

import { liveViewRootRenderer, rootTemplateRenderer } from "./templateRenderers";
import { configLiveViewHandler, NodeSessionSerDe } from "./httpLiveViewAdaptor";
import { Server } from "http";
import WebSocket from "ws";
import { nanoid } from "nanoid";
import { NodeWsAdaptor } from "./wsLiveViewAdatpr";

// extend / define session interface
declare module "express-session" {
  interface SessionData {
    _csrf_token: string;
  }
}

const router: LiveViewRouter = {
  "/light": new LightLiveViewComponent(),
  // sub paths also work
  "/foo/light": new LightLiveViewComponent(),
  "/license": new LicenseLiveViewComponent(),
  "/sales-dashboard": new SalesDashboardLiveViewComponent(),
  "/search": new SearchLiveViewComponent(),
  "/autocomplete": new AutocompleteLiveViewComponent(),
  "/paginate": new PaginateLiveViewComponent(),
  "/sort": new SortLiveViewComponent(),
  "/servers": new ServersLiveViewComponent(),
  "/volunteers": new VolunteerComponent(),
  // "/asyncfetch": new AsyncFetchLiveViewComponent(),
  "/decarbonize": new DecarbonizeLiveView(),
};

const signingSecret = "MY_VERY_SECRET_KEY";
const app = express();

// serve compiled liveviewjs client
app.use(express.static(path.join(__dirname, "..", "build", "client")));

// setup session
app.use(
  session({
    secret: signingSecret,
    resave: false,
    rolling: true,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
    store: new MemoryStore(),
  })
);

// add basic request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// register live_title_tag helper
app.locals.live_title_tag = live_title_tag;
app.locals.live_flash = live_flash;

// handle all views and look up components by path
app.use(
  configLiveViewHandler(
    () => router,
    rootTemplateRenderer,
    signingSecret,
    { title: "Express Demo", suffix: " · LiveViewJS" },
    liveViewRootRenderer
  )
);

app.get("/", (req, res) => {
  // this one renders the index of the examples
  res.render("index.html.ejs", {
    routes: routeDetails,
  });
});

// simple example of non-LiveView route not at root
app.get("/foo", (req, res) => {
  res.send("Foo!");
});

// add error handler after all routes
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  // show something nice to the user...
  res.status(500).send("<h1>Uh Oh.  We had a problem loading your page</h1><div>We are working on it.</div>");
});

// configure express to handle both http and websocket requests
const messageRouter = new WsMessageRouter(
  new NodeSessionSerDe(signingSecret),
  new SingleProcessPubSub(),
  liveViewRootRenderer
);

const httpServer = new Server();
const socketServer = new WebSocket.Server({
  server: httpServer,
});

// handle https requests
httpServer.on("request", app);

// handle websocket requests
socketServer.on("connection", (socket) => {
  console.log("connected to ws");
  const connectionId = nanoid();
  // handle ws messages
  socket.on("message", async (message) => {
    const wsAdaptor = new NodeWsAdaptor(socket);
    await messageRouter.onMessage(wsAdaptor, message.toString(), router, connectionId);
  });
  socket.on("close", async (code) => {
    await messageRouter.onClose(code, connectionId);
  });
});

// listen for requests
const port = process.env.PORT || 4444;
httpServer.listen(port, () => {
  console.log(`LiveViewJS Express is listening on port ${port} !`);
});
