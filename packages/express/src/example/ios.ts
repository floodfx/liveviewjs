import { Server } from "http";
import { LiveViewRouter } from "liveviewjs";
import { WebSocketServer } from "ws";
import { NodeExpressLiveViewServer } from "../node/server";
import { configureExpress, logRequests } from "./express";
import { indexHandler } from "./indexHandler";
import { iosPageRenderer, iosRootRenderer } from "./iosTemplates";
import { catLive } from "./liveview/ios/cat";
import { catListLive } from "./liveview/ios/catList";

// basic server options
const signingSecret = process.env.SESSION_SECRET ?? "MY_VERY_SECRET_KEY";
const port = process.env.PORT ?? 4001;

// route paths to LiveViews
const router: LiveViewRouter = {
  "/cats": catListLive,
  "/cats/:cat": catLive,
};

// configure LiveViewJS server
const liveServer = new NodeExpressLiveViewServer(
  router,
  iosPageRenderer,
  signingSecret,
  { title: "LiveViewNative Demo", suffix: " · LiveViewJS" },
  {
    wrapperTemplate: iosRootRenderer,
    onError: (err) => console.error(err),
    debug: (msg) => console.log(msg),
  }
);

// configure express server
const express = configureExpress(signingSecret);
express.use(liveServer.httpMiddleware); // allow LiveViewJS to handle LiveView http requests
express.use(logRequests(router)); // middleware to log requests
express.get("/", indexHandler); // index route handler

// configure http server to send requests to express
const server = new Server();
server.on("request", express);

// configure websocket server to send requests to LiveViewJS
const ws = new WebSocketServer({ server });
ws.on("connection", liveServer.wsMiddleware);

// listen for requests
server.listen(port, () => {
  console.log(`LiveViewJS is listening at: http://localhost:${port}`);
});
