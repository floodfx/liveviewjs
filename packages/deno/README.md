# 👁 LiveViewJS for 🦕 Deno

The project enables developers to use [LiveViewJS](http://liveviewjs.com) with Deno.

This project contains code that enables developers to add LiveViewJS to your Deno + Oak application (see `src/deno`).  Additionally, it contains example code of a working Deno + Oak server with all the example LiveViews from the examples package (see `src/example`).

## To Use LiveViewJS in your Deno + Oak app

Integration LiveViewJS to your Deno + Oak takes three steps:

 1. Add LiveViewJS to your Deno + Oak app via `deps.ts` or `import_map.json` - https://deno.land/x/liveviewjs@VERSION/mod.ts (repalce VERSION with the latest version of LiveViewJS)

 2. Create one or more `LiveView`s (use `BaseLiveView` as your base class) - Feel free to use an [example](/packages/examples) or include from the `https://deno.land/x/liveviewjs@VERSION/packages/examples/mod.ts` package.
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
// initialize the LiveViewServerAdaptor for Deno+Oak
const liveViewAdaptor = new DenoOakLiveViewServer(
  liveViewRouter,
  new DenoJwtSerDe(),
  new SingleProcessPubSub(),
  pageRenderer,
  { title: "Deno Demo", suffix: " · LiveViewJS" },
  new SessionFlashAdaptor(),
  // optional: rootRenderer
);

//...

// setup the LiveViewJS middleware
app.use(liveViewAdaptor.httpMiddleware());

//...

// integrate LiveViewJS with this server's websocket listener
const wsRouter = liveViewAdaptor.wsRouter();

// send websocket requests to the LiveViewJS message router
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
```
**That's it!!!** Start your server and start making requests to the LiveView routes!

### Feedback is a 🎁
Like all software, this is a work in progress. If you have any feedback, please let us know by opening an issue on the [GitHub repository](https://github.com/floodfx/liveviewjs/issues).

### More Details on `src/deno` code
`src/deno` is the code that allows developers to add LiveViewJS to their Deno + Oak application.

 - index.ts - barrel file for Deno + Oak LiveViewJS adaptors
 - broadcastChannelPubSub.ts - use Deno's [BroadcastChannel](https://deno.com/deploy/docs/runtime-broadcast-channel) to implement the LiveViewJS PubSub interface
 - jwtSerDe.ts - uses the Deno crypto library to sign and verify JWTs for client/server data exchange
 - server.ts - Deno + Oak Server Adaptor for LiveViewJS
 - wsSocketAdaptor.ts - Deno + Oak Adaptor for WebSockets

### More Details on `src/example` code
`src/example` is the code that contains a working Deno + Oak server with all the example LiveViews from the examples package.

 - index.ts - the Deno + Oak server
 - indexHandler.ts - shows an index html page with links to all the examples
 - liveViewRenderers.ts - defines the page layout and root layouts for all the LiveViews (i.e.,  implements the `LiveViewPageRenderer` and the `LiveViewRootRenderer` interfaces)


## To Run the example server
Check out the full LiveViewJS repository:
`git clone https://github.com/floodfx/liveviewjs.git`

`cd` to this package:
`cd packages/deno`

Then run the following command:
`deno run --allow-run --allow-read --allow-env  src/example/autorun.ts`

## To Run on Deno Deploy
Run the following:
`deployctl deploy --project=<Your Project> --import-map=import_map.json src/example/index.ts`




