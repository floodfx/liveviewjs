---
to: src/server/index.ts
---
import { NodeExpressLiveViewServer } from "@liveviewjs/express";
import { Server } from "http";
import { WebSocketServer } from "ws";
import { configureExpress, indexHandler, logRequests } from "./express";
import { htmlPageTemplate } from "./liveTemplates";
import { liveRouter } from "./liveview/router";

// basic server options
const signingSecret = process.env.SESSION_SECRET ?? "MY_VERY_SECRET_KEY";
const port = process.env.PORT ?? 4001;

// configure LiveViewJS server
const liveServer = new NodeExpressLiveViewServer(liveRouter, htmlPageTemplate, signingSecret, {
  title: "<%= h.inflection.camelize(name, false) %>",
  suffix: " · LiveViewJS",
});

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
  console.log(`<%= h.inflection.camelize(name, false) %> is listening at: http://localhost:${port}`);
});
