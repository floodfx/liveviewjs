import { BroadcastChannelPubSub } from "../deno/broadcastChannelPubSub.ts";
import { DenoOakLiveViewServer } from "../deno/server.ts";
import {
  Application,
  autocompleteLiveView,
  booksLiveView,
  counterLiveView,
  dashboardLiveView,
  decarbLiveView,
  helloNameLiveView,
  helloToggleEmojiLiveView,
  jsCmdsLiveView,
  LiveViewRouter,
  paginateLiveView,
  photosLiveView,
  printLiveView,
  Router,
  searchLiveView,
  send,
  serversLiveView,
  sortLiveView,
  volumeLiveView,
  volunteerLiveView,
  xkcdLiveView,
} from "../deps.ts";
import { indexHandler } from "./indexHandler.ts";
import { liveHtmlTemplate, wrapperTemplate } from "./liveTemplates.ts";
import { rtCounterLiveView } from "./liveview/rtcounter.ts";

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
  "/photos": photosLiveView,
  "/xkcd": xkcdLiveView,
  "/rtcounter": rtCounterLiveView,
  "/books": booksLiveView,
  "/helloToggle": helloToggleEmojiLiveView,
  "/hi/:name": helloNameLiveView,
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
  liveHtmlTemplate,
  { title: "Deno Demo", suffix: " · LiveViewJS" },
  {
    wrapperTemplate: wrapperTemplate,
    pubSub: new BroadcastChannelPubSub(),
  }
);

// setup the LiveViewJS HTTP middleware
app.use(liveView.httpMiddleware());

// in Deno, websocket requests come in over http and get "upgraded" to web socket requests
// so we add the wsMiddleware to this http route
router.get("/live/websocket", liveView.wsMiddleware());

// setup index route
router.get("/", indexHandler);

// serve images or js files
router.get("/(.*).(png|jpg|jpeg|gif|js|js.map)", async (ctx) => {
  const path = ctx.request.url.pathname;
  await send(ctx, path, {
    root: "./public/",
  });
});

// add oak router to app
app.use(router.routes());
app.use(router.allowedMethods());

// listen for requests
const port = Number(Deno.env.get("PORT")) || 9001;
console.log(`LiveViewJS Express is listening on port ${port}!`);
await app.listen({ port });
