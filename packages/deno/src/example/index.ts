import { DenoJwtSerDe } from "../deno/jwtSerDe.ts";
import { DenoOakLiveViewServer } from "../deno/server.ts";
import { DenoWsAdaptor } from "../deno/wsAdaptor.ts";
import {
  Application,
  autocompleteLiveView,
  counterLiveView,
  dashboardLiveView,
  decarbLiveView,
  jsCmdsLiveView,
  LiveViewRouter,
  nanoid,
  paginateLiveView,
  printLiveView,
  Router,
  searchLiveView,
  serversLiveView,
  SessionFlashAdaptor,
  SingleProcessPubSub,
  sortLiveView,
  volumeLiveView,
  volunteerLiveView,
} from "../deps.ts";
import { indexHandler } from "./indexHandler.ts";
import { pageRenderer, rootRenderer } from "./liveViewRenderers.ts";

// map request paths to LiveViews
const lvRouter: LiveViewRouter = {
  "/autocomplete": autocompleteLiveView,
  "/decarbonize": decarbLiveView,
  "/prints": printLiveView,
  "/volume": volumeLiveView,
  "/paginate": paginateLiveView,
  "/dashboard": dashboardLiveView,
  "/search": searchLiveView,
  "/servers": serversLiveView,
  "/sort": sortLiveView,
  "/volunteers": volunteerLiveView,
  "/counter": counterLiveView,
  "/jscmds": jsCmdsLiveView,
};

// configure your oak app
const app = new Application();
const router = new Router();

// middleware to log requests
app.use(async (ctx, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url} - ${new Date().toISOString()}`);
  await next();
});

// initialize the LiveViewServer
const liveView = new DenoOakLiveViewServer(
  lvRouter,
  new DenoJwtSerDe(),
  new SingleProcessPubSub(),
  pageRenderer,
  { title: "Deno Demo", suffix: " · LiveViewJS" },
  new SessionFlashAdaptor(),
  rootRenderer
);

// setup the LiveViewJS middleware
app.use(liveView.httpMiddleware());

// initialize the LiveViewJS websocket message router
const liveViewRouter = liveView.wsRouter();

// in Deno, websocket requests come in over http and get "upgraded" to web socket requests
router.get("/live/websocket", async (ctx) => {
  // upgrade the request to a websocket connection
  const ws = await ctx.upgrade();
  const connectionId = nanoid();
  ws.onmessage = async (message) => {
    // pass websocket messages to LiveViewJS
    await liveViewRouter.onMessage(connectionId, message.data, new DenoWsAdaptor(ws));
  };
  ws.onclose = async () => {
    // pass websocket close events to LiveViewJS
    await liveViewRouter.onClose(connectionId);
  };
});

// setup index route
router.get("/", indexHandler);

// add oak router to app
app.use(router.routes());
app.use(router.allowedMethods());

// listen for requests
const port = Number(Deno.env.get("PORT")) || 9001;
console.log(`LiveViewJS Express is listening on port ${port}!`);
await app.listen({ port });
