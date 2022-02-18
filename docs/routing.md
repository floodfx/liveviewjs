## Routing

LiveViewJS supports routing to both `LiveViewComponent` and traditional web route handlers.

As noted in the examples, the `LiveViewRouter` is a simple object that maps paths to `LiveViewComponent`s.
```ts
// import package
import {LiveViewServer} from "liveviewjs";

// create new LiveViewServer
const lvServer = new LiveViewServer();

// define your routes by mapping paths to LiveViewComponents
const lvRouter: LiveViewRouter = {
  "/light": new LightLiveViewComponent();
}
// AND then passing the router to the server
lvServer.registerLiveViewRoutes(lvRouter);

// OR register your route with the server directly
// lvServer.registerLiveViewRoute("/light", new LightLiveViewComponent());
```

HTTP GET requests to `/light` route will be intercepted by the `LiveViewServer` and routed to the `LightLiveViewComponent`.

If you need to handle non-LiveView requests (for example, login routes, you can get the `expressApp` from the `LiveViewServer` and add route handlers to it in the same way you would with a traditional express app.

E.g. to register the `/foo` route:
```ts
lvServer.expressApp.get("/foo", (req, res) => {
  // my business logic
  res.send("Foo!")
})
```

Then when your `LiveViewServer` is started, it will handle both LiveView and non-LiveView requests.

```ts
// start server
lvServer.start();
```

See `src/examples/index.ts` for a working example.
