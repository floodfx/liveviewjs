import { createServer } from "node:http";
import { resolve } from "node:path";
import express from "express";
import session from "express-session";
import { WebSocketServer } from "ws";
import { createLiveView, html, LiveViewHtmlPageTemplate, safe } from "liveviewjs";
import { NodeExpressLiveViewServer } from "../../../packages/express/src/node/server";

type LifecycleContext = {
  connection: "connected" | "disconnected";
  count: number;
};

const lifecycleLiveView = createLiveView<LifecycleContext>({
  mount(socket) {
    socket.assign({
      connection: socket.connected ? "connected" : "disconnected",
      count: 0,
    });
  },
  handleEvent(event, socket) {
    if (event.type === "increment") {
      socket.assign({ count: socket.context.count + 1 });
    }
  },
  render(context) {
    return html`<main id="oracle-root" data-capability-id="protocol.lifecycle.basic">
  <h1>Protocol lifecycle</h1>
  <p id="connection-state">${context.connection}</p>
  <output id="count">${context.count}</output>
  <button id="increment" type="button" phx-click="increment">Increment</button>
</main>`;
  },
});

const pageTemplate: LiveViewHtmlPageTemplate = (_title, csrfToken, liveViewContent) => html`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="csrf-token" content="${csrfToken}" />
    <title data-default="LiveViewOracle" data-suffix=" · Phoenix Framework">LiveViewOracle · Phoenix Framework</title>
    <script defer phx-track-static type="text/javascript" src="/assets/app.js"></script>
  </head>
  <body>${safe(liveViewContent)}</body>
</html>`;

const signingSecret = "liveviewjs-compatibility-signing-secret";
const liveServer = new NodeExpressLiveViewServer(
  { "/scenarios/protocol.lifecycle.basic": lifecycleLiveView },
  pageTemplate,
  signingSecret,
  { title: "LiveViewOracle", suffix: " · Phoenix Framework" },
  { liveViewVersion: "1.2.10" }
);

const app = express();
app.use(express.static(resolve(__dirname, "../public")));
app.use(
  session({
    secret: signingSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, sameSite: "lax" },
  })
);
app.use(liveServer.httpMiddleware);

const server = createServer(app);
const webSockets = new WebSocketServer({ server });
webSockets.on("connection", liveServer.wsMiddleware);

const port = Number.parseInt(process.env.PORT ?? "4103", 10);
server.listen(port, "127.0.0.1", () => {
  console.log(`LiveViewJS compatibility target listening at http://localhost:${port}`);
});
