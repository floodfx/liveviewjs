import express, { NextFunction, Request, Response } from "express";
import session, { MemoryStore } from "express-session";
import { Server } from "http";
import { LiveViewRouter } from "liveviewjs";
import { WebSocketServer } from "ws";
import { NodeExpressLiveViewServer } from "../node/server";
import { indexHandler } from "./indexHandler";
import { iosPageRenderer, iosRootRenderer } from "./iosRenderers";
import { catLive } from "./liveview/ios/cat";
import { catListLive } from "./liveview/ios/catList";

// you'd want to set this to some secure, random string in production
const signingSecret = "MY_VERY_SECRET_KEY";

// map request paths to LiveViews
const router: LiveViewRouter = {
  "/cats": catListLive,
  "/cats/:cat": catLive,
};

// configure your express app
const app = express();

// add static file serving
app.use(express.static("public"));

// setup express-session middleware
app.use(
  session({
    secret: signingSecret,
    resave: false,
    rolling: true,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
    store: new MemoryStore(),
  })
);

// add flash object to session data
declare module "express-session" {
  interface SessionData {
    flash: any;
  }
}

// basic middleware to log requests
app.use((req: Request, res: Response, next: NextFunction) => {
  const isLiveView = router.hasOwnProperty(req.path);
  console.log(`${req.method} ${isLiveView ? "LiveView" : ""} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// initialize the LiveViewServer
const liveView = new NodeExpressLiveViewServer(
  router,
  iosPageRenderer,
  { title: "iOS Demo", suffix: " · LiveViewJS" },
  {
    serDeSigningSecret: signingSecret,
    wrapperTemplate: iosRootRenderer,
    onError: (err) => console.error(err),
    debug: (msg) => console.log(msg),
  }
);

// setup the LiveViewJS middleware
app.use(liveView.httpMiddleware());

// setup index route
app.get("/", indexHandler);

// configure express to handle both http and websocket requests
const httpServer = new Server();
const wsServer = new WebSocketServer({
  server: httpServer,
});

// send http requests to the express app
httpServer.on("request", app);

// initialize the LiveViewJS websocket message router
const liveViewWsMiddleware = liveView.wsMiddleware();
liveViewWsMiddleware(wsServer);

// listen for requests
const port = process.env.PORT || 4001;
httpServer.listen(port, () => {
  console.log(`LiveViewJS Express is listening on port ${port}!`);
});
