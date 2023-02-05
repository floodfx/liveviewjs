---
to: <%= h.changeCase.lower(name) %>/src/server/index.ts
---
import { BroadcastChannelPubSub, DenoOakLiveViewServer } from "@liveviewjs/deno";
import { Application, Router } from "../deps.ts";
import { htmlPageTemplate } from "./liveTemplates.ts";
import { liveRouter } from "./liveview/router.ts";
import { logRequests, serveStatic } from "./oak.ts";

// initialize the LiveViewServer
const liveServer = new DenoOakLiveViewServer(
  liveRouter,
  htmlPageTemplate,
  { title: "Deno Demo", suffix: " · LiveViewJS" },
  {
    pubSub: new BroadcastChannelPubSub(),
    // onError: console.error, // uncomment to see errors
    // debug: console.log, // uncomment to see messages
  }
);

// configure oak router
const router = new Router();
// send websocket requests to the LiveViewJS server
router.get("/live/websocket", liveServer.wsMiddleware);
// redirect index to /hello
router.get("/", (ctx) => ctx.response.redirect("/hello"));
// serve static files (images, js, and css) from public directory
router.get("/(.*).(png|jpg|jpeg|gif|js|js.map|css)", serveStatic);

// configure oak application
const app = new Application();
// send http requests to the LiveViewJS server
app.use(liveServer.httpMiddleware);
app.use(logRequests(liveRouter));
// add oak router to app
app.use(router.routes());
app.use(router.allowedMethods());

// listen for requests
const port = Number(Deno.env.get("PORT") ?? 9001);
console.log(`LiveViewJS (Deno) is listening at: http://localhost:${port}`);
await app.listen({ port });
