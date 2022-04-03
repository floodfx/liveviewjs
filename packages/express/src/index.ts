import express, { NextFunction, Request, Response } from "express";
import session, { MemoryStore } from "express-session";
import WebSocket from "ws";
import { Server } from "http";
import { nanoid } from "nanoid";
import { LiveViewRouter, WsMessageRouter, SingleProcessPubSub } from "liveviewjs";
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
import { liveViewRootRenderer, rootTemplateRenderer } from "./liveViewRenderers";
import { connectLiveViewJS } from "./httpLiveViewMiddleware";
import { NodeWsAdaptor } from "./wsLiveViewAdaptor";
import { NodeJwtSerDe } from "./jwtSerDe";

// you'd want to set this to some secure, random string in production
const signingSecret = "MY_VERY_SECRET_KEY";

// map request paths to LiveViews
const router: LiveViewRouter = {
  "/light": new LightLiveViewComponent(),
  "/license": new LicenseLiveViewComponent(),
  "/sales-dashboard": new SalesDashboardLiveViewComponent(),
  "/search": new SearchLiveViewComponent(),
  "/autocomplete": new AutocompleteLiveViewComponent(),
  "/paginate": new PaginateLiveViewComponent(),
  "/sort": new SortLiveViewComponent(),
  "/servers": new ServersLiveViewComponent(),
  "/volunteers": new VolunteerComponent(),
  "/decarbonize": new DecarbonizeLiveView(),
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

// basic middleware to log requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// setup the LiveViewJS middleware
app.use(
  connectLiveViewJS(
    router,
    rootTemplateRenderer,
    signingSecret,
    { title: "Express Demo", suffix: " · LiveViewJS" },
    liveViewRootRenderer
  )
);

// configure express to handle both http and websocket requests
const httpServer = new Server();
const wsServer = new WebSocket.Server({
  server: httpServer,
});

// send http requests to the express app
httpServer.on("request", app);

// initialize the LiveViewJS websocket message router
const messageRouter = new WsMessageRouter(
  new NodeJwtSerDe(signingSecret),
  new SingleProcessPubSub(),
  liveViewRootRenderer
);

// send websocket requests to the LiveViewJS message router
wsServer.on("connection", (ws) => {
  const connectionId = nanoid();
  ws.on("message", async (message) => {
    // pass websocket messages to LiveViewJS
    await messageRouter.onMessage(new NodeWsAdaptor(ws), message.toString(), router, connectionId);
  });
  ws.on("close", async (code) => {
    // pass websocket close events to LiveViewJS
    await messageRouter.onClose(code, connectionId);
  });
});

// listen for requests
const port = process.env.PORT || 4444;
httpServer.listen(port, () => {
  console.log(`LiveViewJS Express is listening on port ${port}!`);
});
