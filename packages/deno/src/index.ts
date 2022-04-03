import { Application, nanoid, Router, LiveViewRouter, WsMessageRouter, SingleProcessPubSub } from "./deps.ts";
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
  VolunteerComponent
} from "./deps.ts";
import { rootTemplateRenderer, liveViewRootRenderer } from "./liveViewRenderers.ts";
import { connectLiveViewJS } from "./httpLiveViewMiddleware.ts";
import { DenoWsAdaptor } from "./wsLiveViewAdaptor.ts";
import { DenoJwtSerDe } from "./jwtSerDe.ts";

// map request paths to LiveViews
const liveViewRouter: LiveViewRouter = {
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

// configure your oak app
const app = new Application();
const router = new Router();

// middleware to log requests
app.use(async (ctx, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url} - ${new Date().toISOString()}`);
  await next();
});

// setup the LiveViewJS middleware
app.use(connectLiveViewJS(
  liveViewRouter,
  rootTemplateRenderer,
  {title: "Deno Demo", suffix: " · LiveViewJS"},
  liveViewRootRenderer
));

// initialize the LiveViewJS websocket message router
const wsMessageRouter = new WsMessageRouter(
  new DenoJwtSerDe(),
  new SingleProcessPubSub(),
  liveViewRootRenderer
);

// in Deno, websocket requests come in over http and get "upgraded" to web socket requests
router.get("/live/websocket", async (ctx) => {
  // upgrade the request to a websocket connection
  const ws = await ctx.upgrade();
  const connectionId = nanoid();
  ws.onmessage = async (ev) => {
    // pass websocket messages to LiveViewJS
    await wsMessageRouter.onMessage(
      new DenoWsAdaptor(ws),
      ev.data,
      liveViewRouter,
      connectionId
    );
  };
  ws.onclose = async (ev) => {
    // pass websocket close events to LiveViewJS
    await wsMessageRouter.onClose(ev.code, connectionId);
  };
});

// add oak router to app
app.use(router.routes());
app.use(router.allowedMethods());

// listen for requests
const port = Number(Deno.env.get("PORT")) || 9001;
console.log(`LiveViewJS Express is listening on port ${port}!`)
await app.listen({ port });
