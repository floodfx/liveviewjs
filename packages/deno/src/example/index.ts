import { Application, LiveViewRouter, nanoid, Router, SingleProcessPubSub, SessionFlashAdaptor } from "../deps.ts";
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
} from "../deps.ts";
import { pageRenderer, rootRenderer } from "./liveViewRenderers.ts";
import { DenoOakLiveViewServer } from "../deno/server.ts";
import { DenoWsAdaptor } from "../deno/wsAdaptor.ts";
import { DenoJwtSerDe } from "../deno/jwtSerDe.ts";
import { indexHandler } from "./indexHandler.ts";

// map request paths to LiveViews
const lvRouter: LiveViewRouter = {
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
