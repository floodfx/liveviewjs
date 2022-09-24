# 👁 LiveViewJS for NodeJS + Express

The project enables developers to use [LiveViewJS](http://liveviewjs.com) with [Express](https://expressjs.com).

This project contains code that enables developers to add LiveViewJS to your NodeJS + Express application (see `src/node`).  Additionally, it contains example code of a working ExpressJS server with all the example LiveViews from the examples package (see `src/example`).

## To Use LiveViewJS in your Express app

Integration LiveViewJS to your Express takes three steps:

 1. Add LiveViewJS to your package.json Express app:
 `npm install liveviewjs @liveviewjs/express`

 2. Create one or more `LiveView`s (use `BaseLiveView` as your base class) - Feel free to use an [example](/packages/examples) or include from the `@liveviewjs/examples` package.
```ts
  export class MyLiveView extends BaseLiveView<MyContext, MyEvents> {...}
```

 2. Create a `LiveViewRouter` to map your `LiveView`s to request paths. This is how requests are routed to your `LiveView`s both HTTP and WebSockets.
```ts
  const liveViewRouter: LiveViewRouter = {
    "/myroute": new MyLiveView(), // maps /myroute to MyLiveView
  }
```

 3. Define a `LiveViewPageRenderer` which defines the page layout in which your `LiveView`s will be rendered. Optionally, you can define a `LiveViewRootRenderer` which defines another level in which to render your `LiveView`s (often used for things like flash messages)
```ts
// define the page layout in which your LiveViews will be rendered,
// also loads the LiveView client javascript which facilitates the
// communication between the client and the server
export const pageRenderer: LiveViewPageRenderer = (
  pageTitleDefaults: PageTitleDefaults,
  csrfToken: string,
  liveViewContent: LiveViewTemplate
): LiveViewTemplate => {
  return html`
     <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <!-- the csrfToken is required for security and will be provided to this function -->
        <meta name="csrf-token" content="${csrfToken}" />
        <!-- live_title_tag enables title updates from LiveViews -->
        ${live_title_tag(pageTitle, { prefix: pageTitlePrefix, suffix: pageTitleSuffix })}
        <!-- your browser/liveview javascript see: packages/browser-->
        <script defer type="text/javascript" src="/client-liveview.js"></script>
        <!-- nprogress shows a tiny progress bar when requests are made between client/server -->
        <link rel="stylesheet" href="https://unpkg.com/nprogress@0.2.0/nprogress.css" />
        <!-- your favorite css library -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@exampledev/new.css@1.1.2/new.min.css" />
      </head>
      <body>
        <!-- the to-be-rendered LiveView content -->
        ${safe(liveViewContent)}
      </body>
    </html>`
}
```

 4. Configure your `LiveViewServerAdaptor` and integrate the `httpMiddleware` and `wsAdaptor` functions into your server.
```ts
// initialize the LiveViewServer
const liveView = new NodeExpressLiveViewServer(
  router,
  new NodeJwtSerDe(signingSecret),
  new SingleProcessPubSub(),
  pageRenderer,
  { title: "Express Demo", suffix: " · LiveViewJS" },
  new SessionFlashAdaptor(),
  rootRenderer
);

//...

// setup the LiveViewJS middleware
app.use(liveViewAdaptor.httpMiddleware());

//...

// initialize the LiveViewJS websocket message router
const liveViewRouter = liveView.wsRouter();

// send websocket requests to the LiveViewJS message router
wsServer.on("connection", (ws) => {
  const connectionId = nanoid();
  ws.on("message", async (message) => {
    // pass websocket messages to LiveViewJS
    await liveViewRouter.onMessage(connectionId, message.toString(), new NodeWsAdaptor(ws));
  });
  ws.on("close", async () => {
    // pass websocket close events to LiveViewJS
    await liveViewRouter.onClose(connectionId);
  });
});
```
**That's it!!!** Start your server and start making requests to the LiveView routes!

### Feedback is a 🎁
Like all software, this is a work in progress. If you have any feedback, please let us know by opening an issue on the [GitHub repository](https://github.com/floodfx/liveviewjs/issues).

### More Details on `src/node` code
`src/node` is the code that allows developers to add LiveViewJS to Express applications.

 - index.ts - barrel file for ExpressJS / LiveViewJS adaptors
 - jwtSerDe.ts - jsonwebtoken-based serializer/desierializer for LiveViewJS server/client communication
 - server.ts - ExpressJS Server Adaptor for LiveViewJS
 - wsAdaptor.ts - ExpressJS / ws Adaptor for WebSockets
 - redisPubSub.ts - PubSub implementation using Redis

### More Details on `src/example` code
`src/example` is the code that contains a working ExpressJS server with all the example LiveViews from the examples package.

 - index.ts - the ExpressJS server
 - indexHandler.ts - shows an index html page with links to all the examples
 - liveViewRenderers.ts - defines the page layout and root layouts for all the LiveViews (i.e.,  implements the `LiveViewPageRenderer` and the `LiveViewRootRenderer` interfaces)


## To Run the example server
Check out the full LiveViewJS repository:
`git clone https://github.com/floodfx/liveviewjs.git`

`cd` to this package:
`cd packages/express`

Then run the following command:
`npm install`
`npm run start`
