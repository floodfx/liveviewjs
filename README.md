<img src="liveviewjs-eye.png" alt="liveviewjs logo" width="100"/>

## LiveViewJS

*An anti-SPA, HTML-first, GSD-focused library for building LiveViews in NodeJS and Deno*

### LiveView Paradigm
The LiveView model is simple.  When a user makes an HTTP request, the server renders an HTML page.  That page then connects to the server via a persistent web socket.  From there, user-initiated events (clicks, form input, key events, focus/blur events) are sent over the web socket to the server in very small packets.  When the server receives the events, it runs the business logic for that LiveView, calculates the new rendered HTML, and then sends *only the diffs* to the client.  The client automatically updates the page with the diffs.  The server can also send diffs back to the client based on events on the server or received from other clients (think chat, or other pub/sub scenarios).

This paradigm was invented by the developers of the [Phoenix Framework](https://www.phoenixframework.org/) and is widely used (and battle-tested) by tens of thousands of [Elixir](https://elixir-lang.org/) developers and projects. LiveViewJS is an implementation of the Phoenix backend in Typescript / JavaScript.  For the client-side code, we use the exact same code/libraries that Phoenix uses.

### What are the advantages of LiveView?
 * Blazing fast first paint - we are just rendering HTML, no huge JS bundles, "hydration", tree-shaking, JSX, etc
 * User-experiences as rich, reactive, and dynamic as SPA frameworks but with a much simpler developer experience with less code
 * Super-simple LiveView lifecycle that can be learned in 10 minutes - usually just `mount`, `handleEvent`, `render` and sometimes `handleParams` and `handleInfo`
 * No need to build a separate back-end REST and/or GraphQL API and related shenanigans - the library automatically sent to the server over a web socket and diffs are automatically applied to the client
 * No synchronizing state between front-end and back-end - all the state is where your data lives...on the server
 * No need to reinvent routing - LiveViews are just URLs and the browser knows how to route them already
 * No need to build or learn a component library (with all its gotchas, workarounds, etc) - just render some HTML and CSS, add some LiveView attributes, and receive events
 * Small yet extensive user-events system that enables rich, dynamic user experiences: clicks, form events, key events, and focus/blur events
 * Robust, battle-tested browser libraries used by tens of thousands of applications - we use the Phoenix LiveView javascript libraries directly (no reinventing the wheel)
 * Simple to use beyond "toy" examples - complexity does not grow exponentially like SPA frameworks

#### Standard "Hello World" Counter Example in LiveViewJS
Below is the standard "hello world" counter implemented in LiveViewJS.
```TypeScript
// define the shape of your LiveView's data
interface Context {
  count: number;
}

// define events handled by this LiveView
type Events = { type: "increment" } | { type: "decrement" };

// create a LiveView using the Context and Events defined above
export class CounterLiveView extends BaseLiveView<Context, Events> {

  // handle the inital request
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>): void {
    socket.assign({ count: 0 }); // initialize your state
  }

  // update state based on events
  handleEvent(event: Events, socket: LiveViewSocket<Context>) {
    const { count } = socket.context;
    switch (event.type) {
      case "increment":
        socket.assign({ count: count + 1 });
        break;
      case "decrement":
        socket.assign({ count: count - 1 });
        break;
    }
  }

  // re-render the LiveView when state changes
  render(context: Context, meta: LiveViewMeta) {
    const { count } = context;
    return html`
      <div>
        <h1>Count is: ${count}</h1>
        <button phx-click="increment">+</button>
        <button phx-click="decrement">-</button>
      </div>
    `;
  }
}
```

### Other Examples
We have **over a dozen** other, non-trivial examples of LiveViews in the `packages/examples` directory including:
 * [XKCD](/packages/examples/src/liveviews/asyncFetch/) - Browse the latest XKCD comics
 * [Dashboard](/packages/examples/src/liveviews/dashboard/) - A Dashboard that updates every second with random metrics
 * [Volume Control](/packages/examples/src/liveviews/volume/) - Volume Control with keyboard inputs (no actual sound)
 * [Search](/packages/examples/src/liveviews/liveSearch/) - Search for businesses in a city by zip code (try 80204)
 * [Autocomplete](/packages/examples/src/liveviews/autocomplete/) - Autocomplete for businesses in a city by zip code (try 80204)
 * [Sorting](/packages/examples/src/liveviews/sorting/) - A table that is sortable by clicking on the column headers and supports pagination
 * and many more...

You can run these by checking out this repo and navigating to either the `packages/express` or `packages/deno` directory and following the directions in the README.md there.

You can also install the examples in your NodeJS app by running:
`npm i -D @liveviewjs/examples`
Check out the code in the `packages/express` directory for example code.

For Deno, the examples are available on DenoLand: (replace VERSION below with the latest version of this library)
`https://deno.land/x/liveviewjs@VERSION/packages/examples/mod.ts`
Check out the code in the `packages/deno` directory for example code.

### How to use LiveViewJS in your NodeJS or Deno app
LiveViewJS works on both NodeJS and Deno and can be added to your application one route at a time on any web server.  Currently, we have prebuilt integrations (HTTP middleware and websocket adaptors) for NodeJS+ExpressJS (see: `packages/express`) and Deno+Oak (see: `packages/deno`).  LiveViewJS is designed so that any NodeJS or Deno webserver that supports HTTP middleware and web sockets can use it (e.g. Koa, Hapi, etc).  If you want to use LiveViewJS on a different webserver please open an issue and we'll work with you to add support for it.

#### Adding LiveViewJS to your existing app

**Prerequisites to adding LiveViewJS**

 1. Install LiveViewJS in your NodeJS or Deno app
   * NodeJS: `npm i liveviewjs`
   * Deno: Add liveviewjs to your `deps.ts` or `import_map.json` - https://deno.land/x/liveviewjs@VERSION/mod.ts (replace VERSION with the latest version of this library)

**Quick Integration Walkthrough**

Quick start of adding LiveViewJS to your application:
 1. Create one or more `LiveView`s (use `BaseLiveView` as your base class) - Feel free to use copy an [example](/packages/examples) or include from the `@liveviewjs/examples` package.
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
// required
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
        <!-- the `csrfToken` is required for security and will be provided to this function-->
        <meta name="csrf-token" content="${csrfToken}" />
        <!-- `live_title_tag` enables title updates from `LiveView`s -->
        ${live_title_tag(pageTitle, { prefix: pageTitlePrefix, suffix: pageTitleSuffix })}
        <!-- your browser/liveview javascript see: packages/browser-->
        <script defer type="text/javascript" src="/browser-liveview.js"></script>
        <!-- nprogress shows a tiny progress bar when requests are made between client/server -->
        <link rel="stylesheet" href="https://unpkg.com/nprogress@0.2.0/nprogress.css" />
        <!-- your favorite css library -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@exampledev/new.css@1.1.2/new.min.css" />
      </head>
      <body>
        <!-- the to-be-rendered LiveView content -->
        ${liveViewContent}
      </body>
    </html>`
}
```

 4. Configure your `LiveViewServerAdaptor` and integrate the `httpMiddleware` and `wsAdaptor` functions into your server.
```ts
// initialize the LiveViewServerAdaptor for your server type
const liveViewAdaptor = new NodeExpressLiveViewServer(
  router,
  new NodeJwtSerDe(signingSecret),
  new SingleProcessPubSub(),
  pageRenderer,
  { title: "Express Demo", suffix: " · LiveViewJS" },
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
wsServer.on("connection", (ws) => {
  const connectionId = nanoid();
  ws.on("message", async (message) => {
    // pass websocket messages to LiveViewJS
    await wsRouter.onMessage(connectionId, message.toString(), new NodeWsAdaptor(ws));
  });
  ws.on("close", async () => {
    // pass websocket close events to LiveViewJS
    await wsRouter.onClose(connectionId);
  });
});
```
That's it!


### Feedback is a 🎁
Like all software, this is a work in progress. If you have any feedback, please let us know by opening an issue on the [GitHub repository](https://github.com/floodfx/liveviewjs/issues).

### Status - **β**
LiveViewJS is in βeta. The project is still young but the code is tested and well-documented.  We are looking for feedback and contributions.

### For Elixir/Phoenix Folks these are the Implemented Phoenix Bindings
The bindings below marked with ✅ are working and tested and most of them have example usage in the `examples` codebase.  Those with `?`, I have not gotten around to testing so not sure if they work. Those marked with ❌ are not yet implemented and known not to work.

(See [Phoenix Bindings Docs](https://hexdocs.pm/phoenix_live_view/bindings.html) for more details)

| Binding         | Attribute            | Supported   |
|-----------------|----------------------|-------------|
| Params          | `phx-value-*`        | ✅          |
| Click Events    | `phx-click`          | ✅          |
| Click Events    | `phx-click-away`     | ✅          |
| Form Events     | `phx-change`         | ✅          |
| Form Events     | `phx-submit`         | ✅          |
| Form Events     | `phx-feedback-for`   | ✅          |
| Form Events     | `phx-disable-with`   | ✅          |
| Form Events     | `phx-trigger-action` | ﹖          |
| Form Events     | `phx-auto-recover`   | ﹖          |
| Focus Events    | `phx-blur`           | ✅          |
| Focus Events    | `phx-focus`          | ✅          |
| Focus Events    | `phx-window-blur`    | ✅          |
| Focus Events    | `phx-window-focus`   | ✅          |
| Key Events      | `phx-keydown`        | ✅          |
| Key Events      | `phx-keyup`          | ✅          |
| Key Events      | `phx-window-keydown` | ✅          |
| Key Events      | `phx-window-keyup`   | ✅          |
| Key Events      | `phx-key`            | ✅          |
| DOM Patching    | `phx-update`         | ✅          |
| DOM Patching    | `phx-remove`         | ﹖          |
| JS Interop      | `phx-hook`           | ✅          |
| Rate Limiting   | `phx-debounce`       | ✅          |
| Rate Limiting   | `phx-throttle`       | ✅          |
| Static Tracking | `phx-track-static`   | ❌          |

#### LiveViewJS Changesets
Phoenix's Ecto ORM library and Phoenix LiveView rely on [Ecto Changesets](https://hexdocs.pm/ecto/Ecto.Changeset.html) to allow filtering, validation, and other logic to be applied to the data.  Changesets are a powerful way to apply logic to data and are used in Phoenix's ORM and LiveView.  LiveViewJS uses Changesets to provide a similar API to Phoenix's though it is NOT a full-blown ORM.

Detailed documentation on [LiveViewJS Changesets](docs/changesets.md).

### Additional Feature Documentation
 * [Updating HTML Document `<title />`](docs/updating-html-title.md)
 * [LiveViewJS Changesets](docs/changesets.md).
 * [Temporary Assigns](docs/temp-assign.md).
 * [Routing Details](docs/routing.md).

### Credit 🙌
Huge shout out to the folks behind Phoenix! They are visionaries and I am just trying to expand their influence to the Typescript / Javascript ecosystem.

### Gratitude 🙏
Thanks to [@ogrodnek](https://github.com/ogrodnek) for the early support, feedback, and the idea to reuse the Phoenix client code instead of reinventing!

Thanks to [@blimmer](https://github.com/blimmer/) for the awesome feedback, documentation suggests, and support!
