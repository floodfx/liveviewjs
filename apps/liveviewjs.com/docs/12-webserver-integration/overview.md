---
sidebar_position: 1
---

# Webserver Integration

Out of the box, **LiveViewJS** supports two webserver integrations:

- ExpressJS (NodeJS)
- Oak (Deno)

Both integrations are very similar and are based on the same core API and intgration points between the webserver and
the LiveViewJS library.

## How the Integration Works

As we've covered elsewhere, LiveViewJS handles both HTTP and Websocket connections for routes that are registered with
it. It does this by providing "middleware" (for HTTP and websocket traffic) that is plugged into the webserver.

This middleware knows how to handle the HTTP and websocket traffic for the routes that are registered with LiveViewJS.

Let's look at an example of how this works in ExpressJS.

```ts
// create our express app
const app = express();
...
// whatever other express setup you need to do
...
// setup our LiveViewJS routes
const router: LiveViewRouter = {
  ...
  "/hello": helloLiveView,
  ...
};
...
// initialize the NodeJS LiveViewServer
const liveView = new NodeExpressLiveViewServer(
  router,
  htmlPageTemplate, // HTML template for all liveviews
  { title: "Express Demo", suffix: " · LiveViewJS" }, // live tag options
);

// setup the LiveViewJS HTTP middleware
app.use(liveView.httpMiddleware());


// configure express to handle both http and websocket requests
const httpServer = new Server();
const wsServer = new WebSocketServer({
  server: httpServer,
});

// send http requests to the express app
httpServer.on("request", app);

// setup the LiveViewJS websocket middleware
const liveViewWsMiddleware = liveView.wsMiddleware();
liveViewWsMiddleware(wsServer);
...
```

## Recap of the Integration Points

Essentially, we do some LiveViewJS configuration, then we plug the LiveViewJS middleware into the webserver and
websocket server.

When traffic comes in, the webserver will pass the request to the LiveViewJS middleware. The middleware checks if the
request is for a LiveViewJS route. If it is, it will handle the request. If it isn't, it will pass the request to the
next middleware in the chain.

Let's look at the integration points in more detail in the next sections.
