import {
  autocompleteLiveView,
  booksLiveView,
  counterLiveView,
  dashboardLiveView,
  decarbLiveView,
  helloToggleEmojiLiveView,
  jsCmdsLiveView,
  paginateLiveView,
  photosLiveView,
  printLiveView,
  rtCounterLiveView,
  searchLiveView,
  serversLiveView,
  sortLiveView,
  volumeLiveView,
  volunteerLiveView,
  xkcdLiveView,
} from "@liveviewjs/examples";
import { LiveViewRouter } from "liveviewjs";
import { LambdaLiveViewServer } from "../lambda/server";
import { htmlPageTemplate, wrapperTemplate } from "./liveTemplates";

// LiveViewRouter that maps the path to the LiveView
const router: LiveViewRouter = {
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
};

// Configure the LambdaLiveViewServer which generates handlers for HTTP
// and WebSocket requests from API Gateway and AWS Lambda
export const liveView = new LambdaLiveViewServer(
  router,
  htmlPageTemplate,
  { title: "Lambda Demo", suffix: " · LiveViewJS" },
  {
    serDeSigningSecret: "signingSecret",
    wrapperTemplate,
  }
);
