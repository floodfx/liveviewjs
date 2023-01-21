import { Server } from "http";
import { WebSocketServer } from "ws";
import { NodeExpressLiveViewServer } from "../node/server";
import { configureExpress, logRequests } from "./express";
import { indexHandler } from "./indexHandler";
import { htmlPageTemplate, wrapperTemplate } from "./liveTemplates";
import { liveRouter } from "./liveview/router";

// basic server options
const signingSecret = process.env.SESSION_SECRET ?? "MY_VERY_SECRET_KEY";
const port = process.env.PORT ?? 4001;

// configure LiveViewJS server
const liveServer = new NodeExpressLiveViewServer(
  liveRouter,
  htmlPageTemplate,
  signingSecret,
  { title: "Express Demo", suffix: " · LiveViewJS" },
  {
    wrapperTemplate,
    // onError: console.error, // print errors to console
    // debug: console.log, // print messages to console
  }
);

// configure express server
const express = configureExpress(signingSecret);
express.use(liveServer.httpMiddleware); // allow LiveViewJS to handle LiveView http requests
express.use(logRequests(liveRouter)); // middleware to log requests
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
