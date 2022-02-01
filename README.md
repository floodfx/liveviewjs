## LiveViewJS

⌘ *Front-end framework for back-end developers* ⌘

### Credit 🙌
This is a port of [Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html) to Typescript / Javascript.  What the Phoenix folks have built is phenominal and I wanted to use that paradigm in Typescript and make it available to others.

### Approach 📐

 * **Reuse Phoenix Client Libraries and app.js code** - The Phoenix team has done a ton of heavy lifting on the client that we can just use.  We also benefit from fixes and improvements in the future.  [See `src/client/liveview.ts` for client code.]

 * **Reuse Phoenix socket message protocol** - The Phoenix team already figured out a great protocol to send events to/from the server.  We just implemented a different backend.

 * **Follow component API design (i.e. `mount`, `render` etc), reimplemented with Typescript (so even more type-safe)** - Components in LiveViewJS follow the `mount`, `render`, `handleEvent`, and `handleInfo` API defined in Phoenix. Again, no need to invent a new API.

### Status - **⍺**
This is still in very early PoC territory.  You probably shouldn't put this into production just yet.

### Show me some code! ⌨️
**Step 1** Implement a `LiveViewComponent`
```ts
import {html, LiveViewComponent, LiveViewContext, LiveViewExternalEventListener, LiveViewInternalEventListener,PhxSocket } from "liveviewjs";

// define your component's data shape
export interface LightContext {
  brightness: number;
}

// optionally define the events your component will respond to
export type LightEvent = "on" | "off";

// implement your LiveViewComponents
export class LightLiveViewComponent implements
  LiveViewComponent<LightContext>,
  LiveViewExternalEventListener<LightContext, "on", any>,
  LiveViewExternalEventListener<LightContext, "off", any> {


  // handle mount events - called on initial http request AND subsequent socket connections
  mount(params: any, session: any, socket: PhxSocket) {
    return { brightness: 10 };
  };

  // define and render the HTML for your LiveViewComponent
  render(context: LiveViewContext<LightContext>) {
    // the `html` function is a tagged template literal that
    // allows LiveView to send back only the data that has changed
    // based on user events - note the `phx-click` bindings on the
    // buttons in the template
    return html`
    <div id="light">
      <h1>Front Porch Light</h1>
      <div class="meter">
        <span style="width: ${context.data.brightness} %>%">
          ${context.data.brightness}%
        </span>
      </div>

      <button phx-click="off">
        Off
      </button>

      <button phx-click="on">
        On
      </button>
    </div>
    `
  };

  // handle external events sent form client
  handleEvent(event: LightEvent, params: any, socket: PhxSocket) {
    const ctx = _db[socket.id]; // lookup current context by socket id
    switch (event) {
      case 'off':
        ctx.brightness = 0;
        break;
      case 'on':
        ctx.brightness = 100;
        break;
    }
    // udpate context by socket id
    _db[socket.id] = ctx;
    return { data: ctx };
  }

}
```

**Step 2** - Register your `LiveViewComponent`s and start the HTTP and Socket server with `LiveViewServer`
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
lvServer.registerLiveViewRoute("/light", new LightLiveViewComponent());

// then start the server
lvServer.start();
```

### Welcome your feedback, issues, and PRs
I am not an expert on Phoenix Liveview, Elixir, Erlang VMs, etc or most things.  Please feel free to open an issue with questios, bugs, etc.

### Commands
`npm i` - install the deps

`npm run build` - builds the framework, client, and examples (server)

`npm run watch` - continually rebuilds the codebase when files are updated

`npm run examples` - runs the examples [See `src/examples`]

`npm run test` - runs the (few) tests

### See Examples
**Credit** These examples are adapted from an amazing [Phoenix Video / Code Course](https://online.pragmaticstudio.com/courses/liveview-starter/steps/15) authored by the folks at [Pragmatic Studio](https://pragmaticstudio.com/).

Run `npm run examples` then point your browser to:
 * `http://localhost:4444/light` - control a fictional porch light with some buttons [See `src/examples/light_liveview.ts`]
 * `http://localhost:4444/license` - calculate the per seat costs to license a SaaS product [See `src/examples/license_liveview.ts`]
 * `http://localhost:4444/sales-dashboard` - show the aggregated sales stats updated every second [See `src/examples/sales_dashboard_liveview.ts`]
 * `http://localhost:4444/search` - search for business by zip code (e.g. 80204) [See `src/examples/live-search/*`]
 * `http://localhost:4444/autocomplete` - search for businesses by city with automatically suggested names [See `src/examples/autocomplete/*`]

### Thanks!
Thanks to [@ogrodnek](https://github.com/ogrodnek) for the early support, feedback, and the idea to reuse the Phoenix client code instead of reinventing!
