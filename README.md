## LiveViewJS

### *Front-end framework for back-end developers*

### Credit 🙌
This is a backend implementation of [Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html) in Typescript.  What the Phoenix folks have built is phenominal and I wanted to use that paradigm in Typescript and make it available to others.

### Quick Overview of LiveView Approach
How Phoenix desribes LiveView:
> LiveView is an exciting new library which enables rich, real-time user experiences with server-rendered HTML. LiveView powered applications are stateful on the server with bidrectional communication via WebSockets, offering a vastly simplified programming model compared to JavaScript alternatives.

In other words, LiveView takes a very different approach than the popular SPA frameworks like React, Vuejs, and Svelt to building rich, highly interactive web applications.  Instead of sending down a bundle of javascript, LiveView apps render an HTML page on the first request and then connect via a persistent socket over which client events are sent and updated received.  These events may trigger a state update on the server and a re-calculation of what the page should look like.  Instead of reloading the page, the client receives a "diff" of the page via the socket and the page's DOM is updated.  (This [video](https://online.pragmaticstudio.com/courses/liveview-pro/modules/4) by Pragmatic Studio does an amazing job of explaining how LiveView works.)

The programming paradigm is extremely powerful and productive!

### Feedback is a 🎁
I am not an expert on Phoenix Liveview, Elixir, Erlang VMs, etc or really most things.  Please feel free to open an issue with questios, bugs, etc.

### Status - **β**
LiveViewJS is in βeta. The project is still young but the code is stable, tested, and well-documented.

### Implemented Phoenix Bindings
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

### Usage - Show me some code! ⌨️

**Step 0** Install LiveViewJS
`npm i liveviewjs`

**Step 1** Implement a `LiveViewComponent`
```ts
import { SessionData } from "express-session";
import {html, BaseLiveViewComponent, LiveViewComponent, LiveViewExternalEventListener, LiveViewMountParams, LiveViewSocket } from "liveviewjs";

// define your component's data shape
export interface LightContext {
  brightness: number;
}

// define the component events
export type LightEvent = "on" | "off" | "up" | "down";

// implement your component
export class LightLiveViewComponent extends BaseLiveViewComponent<LightContext, never> implements
  LiveViewComponent<LightContext, never>,
  LiveViewExternalEventListener<LightContext, LightEvent, never> {

  // mount is called before html render on HTTP requests and
  // when the socket is connected on the phx-join event
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<LightContext>) {
    // set the default value(s) for the component data
    return { brightness: 10 };
  };

  // Define and render the HTML for your LiveViewComponent
  // This function is called after any context change and
  // only diffs are sent back to the page to re-render
  render(context: LightContext) {
    const { brightness } = context;
    return html`
    <div id="light">
      <h1>Front Porch Light </h1>
      <div class="meter">
        <div>${brightness}%</div>
        <progress id="light_level" value="${brightness}" max="100">
        </progress>
      </div>

      <button phx-click="off">
        Off
      </button>

      <button phx-click="down">
        Down
      </button>

      <button phx-click="up">
        Up
      </button>

      <button phx-click="on">
        On
      </button>
    </div>
    `
  };

  // Handle events sent back from the client...  Events
  // may update the state (context) of the component and
  // cause a re-render
  handleEvent(event: LightEvent, params: never, socket: LiveViewSocket<LightContext>) {
    const ctx: LightContext = { brightness: socket.context.brightness };
    switch (event) {
      case 'off':
        ctx.brightness = 0;
        break;
      case 'on':
        ctx.brightness = 100;
        break;
      case 'up':
        ctx.brightness = Math.min(ctx.brightness + 10, 100);
        break;
      case 'down':
        ctx.brightness = Math.max(ctx.brightness - 10, 0);
        break;
    }
    return ctx;
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
#### Other features to be implemented:
* [Updating HTML Document Title](https://hexdocs.pm/phoenix_live_view/live-layouts.html#updating-the-html-document-title) - Vote for [Issue 16](https://github.com/floodfx/liveviewjs/issues/16)
* [LiveView Helpers](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.Helpers.html) - Vote for [Issue 17](https://github.com/floodfx/liveviewjs/issues/17)
* [Temporary Assigns](https://hexdocs.pm/phoenix_live_view/dom-patching.html#temporary-assigns) - Vote for [Issue 18](https://github.com/floodfx/liveviewjs/issues/18)
* [Build in Flash Message Support](https://hexdocs.pm/phoenix_live_view/0.17.6/Phoenix.LiveView.html#put_flash/3) - Vote for [Issue 19](https://github.com/floodfx/liveviewjs/issues/19)
* [File Uploads](https://hexdocs.pm/phoenix_live_view/uploads.html) - Vote for [Issue 20](https://github.com/floodfx/liveviewjs/issues/20)


### NPM Commands
`npm i` - install the deps

`npm run build` - builds the framework, client, and examples (server)

`npm run watch` - continually rebuilds the codebase when files are updated

`npm run examples` - runs the examples [See `src/examples`]

`npm run test` - runs the (few) tests

### Run and Browse Examples
**Credit**: These examples are adapted from an amazing [Phoenix Video / Code Course](https://online.pragmaticstudio.com/courses/liveview-starter/steps/15) authored by the folks at [Pragmatic Studio](https://pragmaticstudio.com/).

Navigate to `src/examples` to see the example code.

Run `npm run examples` then point your browser to:
 * `http://localhost:4444/` - Shows the index of all the examples

 There is also a standalone [TodoMVC](https://github.com/floodfx/todomvc-liveviewjs) example application written in LiveViewJS.

### More Details on the Approach to Building LiveViewJS 📐

 * **Reuse Phoenix Client Libraries and app.js code** - The Phoenix team has done a ton of heavy lifting on the client that we can just use.  We also benefit from fixes and improvements in the future.  [See `src/client/liveview.ts` for client code.]

 * **Reuse Phoenix socket message protocol** - The Phoenix team already figured out a great protocol to send events to/from the server.  We just implemented a different backend.

 * **Follow component API design (i.e. `mount`, `render` etc), reimplemented with Typescript (so even more type-safe)** - Components in LiveViewJS follow the `mount`, `render`, `handleEvent`, and `handleInfo` API defined in Phoenix. Again, no need to invent a new API.

### Gratitude 🙏
Thanks to [@ogrodnek](https://github.com/ogrodnek) for the early support, feedback, and the idea to reuse the Phoenix client code instead of reinventing!

Thanks to [@blimmer](https://github.com/blimmer/) for the awesome feedback, documentation suggests, and support!
