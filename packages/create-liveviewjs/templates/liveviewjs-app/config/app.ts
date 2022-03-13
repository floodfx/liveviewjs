import "dotenv/config";
import { LiveViewRouter, LiveViewServer } from "liveviewjs";
import path from "path";
import { rootController } from "../app/controllers/root/rootController";
import { ClickDemo } from "../app/liveviews/demos/clickLiveView";
import { logTimestamp } from "../app/middleware/demoTimestamp";

// require APP_SIGNING_SECRET to be set
const signingSecret = process.env.APP_SIGNING_SECRET;
if (!signingSecret) {
  throw new Error("APP_SIGNING_SECRET environment variable is not set");
}

declare module "express-session" {
  interface SessionData {
    csrfToken: string;
  }
}

const port = process.env.PORT || 4001;

// configure the new LiveViewServer
const server = new LiveViewServer({
  signingSecret,
  viewsPath: path.join(__dirname, "..", "views"),
  rootView: "liveviews/root.ejs",
  publicPath: path.join(__dirname, "..", "public"),
  port: Number(port),
  pageTitleDefaults: {
    suffix: " - LiveViewJS",
    title: "Starter",
  },
  middleware: [logTimestamp],
});

// register web and liveview routes
const router: LiveViewRouter = {
  "/clickdemo": new ClickDemo(),
};

// register all LiveView routes
server.registerLiveViewRoutes(router);

// add your own "traditional" routes to the express app
server.expressApp.get("/", rootController.index);

// then start the server
server.start();
