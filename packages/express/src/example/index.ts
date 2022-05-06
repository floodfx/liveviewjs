import express, { NextFunction, Request, Response } from "express";
import session, { MemoryStore } from "express-session";
import WebSocket from "ws";
import { Server } from "http";
import { nanoid } from "nanoid";
import { LiveViewRouter, WsMessageRouter, SingleProcessPubSub, SessionFlashAdaptor } from "liveviewjs";
import {
  AutocompleteLiveView,
  DecarbonizeLiveView,
  PrintsLiveView,
  VolumeLiveView,
  PaginateLiveView,
  DashboardLiveView,
  SearchLiveView,
  ServersLiveView,
  SortLiveView,
  VolunteersLiveView,
  CounterLiveView,
} from "@liveviewjs/examples";
import { pageRenderer, rootRenderer } from "./liveViewRenderers";
import { NodeWsAdaptor } from "../node/wsLiveViewAdaptor";
import { NodeJwtSerDe } from "../node/jwtSerDe";
import { indexHandler } from "./indexHandler";
import { NodeExpressLiveViewServer } from "../node/server";

// you'd want to set this to some secure, random string in production
const signingSecret = "MY_VERY_SECRET_KEY";

// map request paths to LiveViews
const router: LiveViewRouter = {
  "/autocomplete": new AutocompleteLiveView(),
  "/decarbonize": new DecarbonizeLiveView(),
  "/prints": new PrintsLiveView(),
  "/volume": new VolumeLiveView(),
  "/paginate": new PaginateLiveView(),
  "/dashboard": new DashboardLiveView(),
  "/search": new SearchLiveView(),
  "/servers": new ServersLiveView(),
  "/sort": new SortLiveView(),
  "/volunteers": new VolunteersLiveView(),
  "/counter": new CounterLiveView(),
};

// configure your express app
const app = express();

// setup express-session middleware
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

// add flash object to session data
declare module "express-session" {
  interface SessionData {
    flash: any;
  }
}

// basic middleware to log requests
app.use((req: Request, res: Response, next: NextFunction) => {
  const isLiveView = router.hasOwnProperty(req.path);
  console.log(`${req.method} ${isLiveView ? "LiveView" : ""} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// initialize the LiveViewServer
const liveView = new NodeExpressLiveViewServer(
  router,
  new NodeJwtSerDe(signingSecret),
  new SingleProcessPubSub(),
  pageRenderer,
  { title: "Express Demo", suffix: " · LiveViewJS" },
  new SessionFlashAdaptor(),
  rootRenderer
);

// setup the LiveViewJS middleware
app.use(liveView.httpMiddleware());

// setup index route
app.get("/", indexHandler);

// configure express to handle both http and websocket requests
const httpServer = new Server();
const wsServer = new WebSocket.Server({
  server: httpServer,
});

// send http requests to the express app
httpServer.on("request", app);

// initialize the LiveViewJS websocket message router
const liveViewRouter = liveView.wsRouter();

// send websocket requests to the LiveViewJS message router
wsServer.on("connection", (ws) => {
  const connectionId = nanoid();
  ws.on("message", async (message) => {
    // pass websocket messages to LiveViewJS
    await liveViewRouter.onMessage(connectionId, message.toString(), new NodeWsAdaptor(ws));
  });
  ws.on("close", async () => {
    // pass websocket close events to LiveViewJS
    await liveViewRouter.onClose(connectionId);
  });
});

// listen for requests
const port = process.env.PORT || 4001;
httpServer.listen(port, () => {
  console.log(`LiveViewJS Express is listening on port ${port}!`);
});
