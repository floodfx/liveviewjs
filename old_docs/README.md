## 👁 LiveViewJS

*An anti-SPA, HTML-first, GSD-focused library for building LiveViews in NodeJS and Deno*

### LiveView Paradigm
The LiveView model is simple.  When a user makes an HTTP request, the server renders an HTML page.  That page then connects to the server via a persistent web socket.  From there, user-initiated events (clicks, form input, key events, focus/blur events) are sent over the web socket to the server in very small packets.  When the server receives the events, it runs the business logic for that LiveView, calculates the new rendered HTML, and then sends *only the diffs* to the client.  The client automatically updates the page with the diffs.  The server can also send diffs back to the client based on events on the server or received from other clients (think chat, or other pub/sub scenarios).

This paradigm was invented by the developers of the [Phoenix Framework](https://www.phoenixframework.org/) and is widely used (and battle-tested) by tens of thousands of [Elixir](https://elixir-lang.org/) developers and projects. LiveViewJS is an implementation of the Phoenix backend in Typescript / JavaScript.  For the client-side code, we use the exact same code/libraries that Phoenix uses.

### What are the advantages of LiveView?
 * Blazing fast first paint - we are just rendering HTML, no downloading huge JS bundles, "hydration", JSX, etc
 * User-experiences as rich, reactive, and dynamic as SPA frameworks but with a much simpler developer paradigm that is requires less context switching
 * Super-simple LiveView lifecycle that can be learned in 5 minutes - usually just `mount`, `handleEvent`, `render` and sometimes `handleParams` and `handleInfo`
 * No need to build a separate back-end REST and/or GraphQL API and related shenanigans - the library automatically handles sending events to the server over a web socket and automatically appling diffs to the client
 * No synchronizing state between front-end and back-end - all the state is where your data lives...on the server
 * No need to reinvent routing - LiveViews are just URLs and the browser knows how to route them already
 * No need to build or learn a component library (with all the effort, variants, workarounds, hacks, etc) - just render some HTML and CSS, add some LiveView attributes, and ship it!
 * Small yet extensive user-events system that enables rich, dynamic user experiences: clicks, form events, key events, and focus/blur events, and escape hatches if needed (but most of the time, you don't need them)
 * Robust, battle-tested browser libraries used by tens of thousands of applications - we use the Phoenix LiveView javascript libraries directly (no reinventing the wheel)
 * Simple to use beyond "toy" examples - complexity does not grow exponentially like SPA frameworks

### Canonical "Counter" Example in LiveViewJS
```ts
import { createLiveView, html } from "liveviewjs";

/**
 * A basic counter that increments and decrements a number.
 */
export const counterLiveView = createLiveView<
  { count: number }, // Define LiveView Context / State
  { type: "increment" } | { type: "decrement" } // Define LiveView Events
>({
  // Setup / initialize the LiveView Context (i.e. set count to 0)
  mount: (socket) => {
    socket.assign({ count: 0 });
  },

  // Handle incoming increment and decrement events from User input
  handleEvent: (event, socket) => {
    const { count } = socket.context;
    switch (event.type) {
      case "increment":
        socket.assign({ count: count + 1 });
        break;
      case "decrement":
        socket.assign({ count: count - 1 });
        break;
    }
  },
  // Renders the Counter View based on the current Context / State
  render: async (context) => {
    const { count } = context;
    return html`
      <div>
        <h1>Count is: ${count}</h1>
        <button phx-click="decrement">-</button>
        <button phx-click="increment">+</button>
      </div>
    `;
  },
});
```

### How to use LiveViewJS in your NodeJS or Deno app
LiveViewJS works on both NodeJS and Deno and can be added to your application one route at a time on any javascript-based web server. Currently, we have prebuilt integrations (HTTP middleware and websocket adaptors) for NodeJS+ExpressJS (see: [`packages/express`](packages/express/)) and Deno+Oak (see: [`packages/deno`](packages/deno/)). LiveViewJS is designed so that any NodeJS or Deno webserver that supports HTTP middleware and web sockets should be able to use it (e.g. Koa, Hapi, etc).  If you want to use LiveViewJS on a different webserver please open an issue and we'll work with you to add support for it.  See the section *Adding LiveViewJS to your existing app* below for more details.

### Run the LiveViewJS Examples in 30 seconds
```bash
# clone the LiveViewJS repo
git clone https://github.com/floodfx/liveviewjs.git
```
If you want to run examples for NodeJS (on Express), you can do it like this:
```bash
cd packages/express
npm install
npm run start
# open your browser to http://localhost:4001/
```
If you want to run examples for Deno, you can do it like this:
```bash
cd packages/deno
deno run --allow-net --allow-read --allow-write --allow-env --import-map=import_map.json src/example/index.ts
# open your browser to http://localhost:9001/
```
To see the examples you just ran navigate to the examples folder:
```bash
cd ../examples
```

### Anatomy of a LiveView
The LiveViewJS API is extremely simple but very flexible.  There are 5 methods that make up the LiveView lifecycle: `mount`, `handleParams`, `handleEvent`, `handleInfo`, and `render`.  The `render` method is the only "required" method.  The other methods are optional but typically `mount` and `handleEvent` are also defined in order to setup the context (i.e. state) of the LiveView and handle user input.

 * `mount` is called both when the `LiveView` is rendered for the HTTP request and upon the first time the `LiveView` is mounted (i.e. connected) via the websocket.  This is where you should load data and set the initial context of the `LiveView`
 * `handleParams` is called on initial loading of the `LiveView` (one-time, after `mount`) as well as on events that manipulate the URL of the `LiveView`. This is where you should handle any context (i.e. state) changes that are based on the `LiveView`'s URL parameters.
 * `handleEvent` is called when events are initiated by the user interactions with the `LiveView`. Things like "clicks", "key events", "form input", and "focus/blur" events are all handled by this method. More details on "bindings" for user events below.
 * `handleInfo` handles server-side events which we call "info" that are initiated from `handleEvent` or other pub/sub subscriptions. Asynchronous processes are often sent to `handleInfo` via a `handleEvent` (e.g. run a search query).  More details below.
 * `render` is the only required method which provides the HTML and CSS that is rendered to the client. All of the other methods manupulate the "context" (i.e. state) of the `LiveView` and the resulting context is passed to the `render` method to determine the HTML and CSS that is rendered to the client.

### HTTP Lifecycle vs Websocket Lifecycle
Quick note on HTTP and Websocket Lifecycles.  In LiveViewJS, each URL path is a different LiveView.  When a user visits a URL, the browser sends a HTTP get request to the server and LiveViewJS renders the page over HTTP.  This is the first HTTP lifecycle for that LiveView instance and the appropriate methods are called on the LiveView which are typically `mount`, `handleParams`, and `render`.  After the page fully loads in the browser, LiveViewJS automatically connects to the server over a websocket and runs the same initial lifecycle methods for the Websocket lifecycle and then starts to handle any user or server ininitated events.  The major difference is between the HTTP and Websocket initialization is that there is no user event handling or internal info handling for the HTTP lifecycle.  This entire HTTP + WS lifecycle happens extremely fast as again, we are rendering HTML not downloading large JS bundles or doing any other heavy lifting.

### User Events
There are 4 main types of user events that a LiveView can listen to and respond to:
  * Click events
  * Form events
  * Key events
  * Focus events

To listen for user events there are a set of "bindings" (a.k.a. attributes) that you add to the HTML elements in your `LiveView` returned by the `render` method.

#### Click Events
User clicks are the most common type of user event and there are two types of click bindings:
  * `phx-click` - Add this binding to an HTML element (e.g. `<... phx-click="myEvent" ...>`) and when a user clicks on the element the event (i.e. value of the attribute) will be sent to the server.
  * `phx-click-away` - This binding is similar to `phx-click` except that an event will occur when the user clicks outside of the element.

**Click binding example** - send the `increment` event to the server when the user clicks on the "+" button
```html
<button phx-click="increment">+</button>
```

#### Form Events
Form events are triggered by the user interacting with form inputs.  There are two types of form bindings:
  * `phx-change` - When a user changes the value of a form element, the event named by the `phx-change` attribute will be sent to the server along with all the form values. This is typically used for form validation purposes prior to form submission.
  * `phx-submit` - This binding is initiated when a user submits a form and the event named by the `phx-submit` attribute will be sent to the server along with all the form values.

Forms are typically used in conjunction with [`LiveViewChangeset`](docs/changesets.md)s to provide validation rules (based on [zod](https://github.com/colinhacks/zod)) and various template helpers like `form_for`, `text_input`, `error_tag`.  These are designed to work together to make form validation and submission easy and powerful.  We'll dive into more details later on.  For now here is an example of a form with `phx-change` and `phx-submit` bindings:
```html
<form action="#" phx-change="validate" phx-submit="save">
  ...
</form>
```

#### Key Events
Key events are triggered by the user pressing a key on the keyboard.  There are key bindings for both the element-level and the window-level:
  * `phx-keydown`, `phx-window-keydown` - When a user presses a key down on the keyboard, the event named by the attribute will be sent to the server along with the key that was pressed.
  * `phx-keyup`, `phx-window-keyup` - When a user releases a key on the keyboard, the event named by the attribute will be sent to the server along with the key that was released.

`phx-key` is an optional attribute which limits triggering of the key events to the key provided in the attribute (e.g. `phx-key="ArrowUp"`).  You can find a list of the keys on [MDN Keyboard Values](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values).

**Key binding example** - send the `key_event` event to the server along with the `{key: "ArrowUp"}` payload when the user presses the "ArrowUp" key
```html
```html
 <div phx-window-keydown="key_event" phx-key="ArrowUp" />
```

#### Focus Events
If a DOM element emits focus and blur events, you can use the following bindings to react to those events:
  * `phx-focus` - When a user focuses on an element, the event named by the `phx-focus` attribute will be sent to the server.
  * `phx-blur` - When a user blurs from an element, the event named by the `phx-blur` attribute will be sent to the server.
Similar to key events, there are window-level and element-level bindings:
  * `phx-window-focus` - When a user focuses on the window, the event named by the `phx-window-focus` attribute will be sent to the server.
  * `phx-window-blur` - When a user blurs from the window, the event named by the `phx-window-blur` attribute will be sent to the server.

**Focus binding example** - send the `focus_event` event to the server when the user focuses on the input and the `blur_event` event when the user blurs from the input
```html
<input name="text" phx-focus="focus_event" phx-blur="blur_event"/>
```

### Additional Bindings
There are other bindings that provide additional functionality for your LiveView and work in conjunction with the event bindings we reviewed above.

#### Value Bindings
When you need to send along additional data with an event binding you can use a value binding which looks something like `phx-value-[NAME]` where `[Name]` is replaced by the key of the value.  This binding can be used in conjunction with other click, key, and focus bindings.

**Value binding example** - send the `mark_complete` event to the server along with the `{id: "myId"}` payload when the user clicks on the "Complete" button
```html
<button phx-click="mark_complete" phx-value-id="myId">Complete</button>
```
Note the `[NAME]` part of `phx-value-[NAME]` is used as the object key while the attribute value is used as the object value.

#### Rate Limiting Bindings
Deboucing and throttling events is a very common need and to support these use-cases there are the following bindings:
 * `phx-debounce` - Debounce an event by the number of milliseconds specified in the attribute value **or** by setting the value to `blur`.  This is useful for preventing multiple events from being sent to the server in rapid succession. When `blur` is the value, the event will be debounced until the element is blurred by the user. Typically used for input elements.
  * `phx-throttle` - Throttle an event by the number of milliseconds specified in the attribute value.  In contrast to debouncing, throttling emits an event immediately and then only once every specified number of milliseconds. Typically used to rate limit click events, key events, and mouse actions.

**Debounce binding example** - send the `validate` event to the server when a user blurs away from the address input
```html
<form action="#" phx-change="validate" phx-submit="save">
  <!--// only send "validate" event when address input is blurred -->
  <input name="address" phx-debounce="blur" />
```

**Debounce binding example** - send the `search` event to the server 1 second after a user stops typing
```html
<form action="#" phx-change="search">
  <!--// send "search" event after 1 second of debouncing  -->
  <input name="query" phx-debounce="1000" />
```

**Throttling binding example** - only send one `volume_up` event every 500ms
```html
  <!--// rate limit clicks on a volume up event -->
  <button phx-click="volume_up" phx-throttle="500" />
```

### LiveView Socket
The `LiveViewSocket` object is a major part of the LiveViewJS API and LiveView lifecycle.  It is passed into each of the non-`render` lifecycle methods (`mount`, `handleParams`, `handleEvent`, `handleInfo`) and provides functionality to manipulate the state of the LiveView, send messages internally, subscribe to pub/sub topics, and many other useful functionality.  Here is some of the functionality provided by the `LiveViewSocket`:

#### Updating State
`socket.assign` and `socket.context` are the work-horse methods for manipulating and reading the state of the LiveView.  The `assign` method is used to update the state of the LiveView and the `context` property is used to read the state of the LiveView.
```ts
// Update the context (i.e. current state) of the `LiveView`
socket.assign({ foo: "bar" })
```
```ts
// use the context from the socket elsewhere
if(socket.context.foo === "baz") {
  // do something
}
// or
const { foo } = socket.context;
```
When creating a `LiveView` developers can provide a type annotation for `TContext` which describes the "shape" of the context. e.g.
```ts

// You can define the "shape" of the TContext by annotating the createLiveView function
const myLiveView = createLiveView<{foo: string}>(
  mount: (socket) => {
    socket.assign({ foo: "bar" });
    ...
    socket.assign({ baz: "qux" }); // type error no "baz" property in context
  }
  ...
)

// Alternatively, you can define the context type first and then use it to as a type annotation for the `LiveView`

// Define the MyContext interface
interface MyContext { foo: string };
// Annotate the createLiveView function with the MyContext interface
const myLiveView = createLiveView<MyContext>(...)
```

The state of a `LiveView` is persisted across page loads on the server-side (in memory by default).  For this reason, there is a method called `socket.tempAssign` which allows a developer to tell LiveViewJS to reset a context property to a given value after the render lifecycle.  Typically this is used for large objects or collections that don't change often and therefore probabaly don't need to be stored in memory (e.g. collection of users or messages, etc).
```ts
// first assign a large object to the context
socket.assign({ photos: [
  ...// 10s, 100s, 1000s, of photos
]});
// use tempAssign to tell LiveViewJS to clear the photos array after this render cycle
socket.tempAssign({ photos: [] });
```

#### Send "Internal" Info
`socket.sendInfo` enables a `LiveView` to send message to itself which is useful for executing actions that are asynchronous.  Messages sent via `socket.sendInfo` are received by the `handleInfo` method after the render lifecycle has completed.  (In other words, `handleInfo` is called after the `render` call which will result in another `render` after `handleInfo` completes.)  A typical pattern for events that run asynchronous processes is to show a loading indicator when the user initiates the event, then execute the process in the background, and update the UI when the process finishes.

When creating your `LiveView` you can provide the typing for `TInfo` which describes the "shape" of the possible info messages.  e.g.
```ts
// Define the MyContext, MyEvents, and MyInfo types
type MyContext = {query: string, loading: boolean, results: string[]};
type MyEvents = {type: "search", query: string};
type MyInfo = {type: "run_search", query: string} | {type: "refresh"};

// Annotate the createLiveView function with the types
const myLiveView = createLiveView<MyContext, MyEvents, MyInfo>(
  handleEvent: (event, socket) => {
    ...
    if(event.type === "search" ) {
      // update the context with loading status and empty results so
      // that UI will be updated for user
      socket.assign({ loading: true, results: [], query: event.query });
      // send internal message to run the search process
      socket.sendInfo({ type: "run_search", query: event.query })
    }
  }
  ...
  handleInfo: (info, socket) => {
    if(info.type === "run_search") {
      const { query } = info;
      // run the search
      const results = searchService.run(query)
      // update the context with results which will update the UI
      socket.assign({ loading: false, results })
    }
    ...
  }
  ...
)
```
`socket.sendInfo` can just take a type as a string for cases where there isn't additional information passed along with the message.
```ts
// or send just the "type" as a string
socket.sendInfo("refresh");
```

#### Push Methods
There are various methods for "pushing" from the server to the client.
 * `socket.pushPatch` is used to push an update of the browser URL (i.e. the path and parameters) from the server
 * `socket.pushRedirect` can be used to shutdown the current `LiveView` and load another `LiveView` without a full HTML refresh or can be used to reload the current `LiveView` if need be
 * `socket.pushEvent` can be used to send data to a client "Hook" (see below) which can be used to update client-side state / UI without reloading.  This is useful for libraries that themselves render client-side such as charting or mapping libraries.

#### Page Title and Flash Messages
`socket.pageTitle` updates the html `<title>` tag for the current page.  This is useful for changing the title as needed.  It requires the use of the `live_title` html helper in your `LiveViewPageRenderer`.

`socket.putFlash` Displaying messages at the top of a page to the user is often called "flash".  `putFlash` adds a string key/value pair to the `SessionData` object available in your `LiveViewRootRenderer` where you can access it and render the messages as you see fit.  Adding a `phx-click="lv:clear-flash"` attribute to your "flash" component will automtically clear the flash message (i.e. remove the key/value pair from the `SessionData` object and initiate a re-render).

#### Repeating / Intervals
`socket.repeat` takes a void function and the intervalMS which to repeat it and continuously runs that function until the `LiveView` is closed.  Useful for kicking off a repeating process like polling for new data, refreshing a chart, etc.

#### Subscribing to Pub/Sub Topics
`socket.subscribe` creates a subscription to a given topic.  Info published on that topic will be passed to the `handleInfo` method of the subscribing `LiveView`.  This is an easy way to listen for events like object mutations, chat messaging, and any other real-time events that may interest your users.  More on Pub/Sub below.

### Pub/Sub
LiveView uses the "Pub/Sub" model underneath to process and deliver messages. Pub/Sub is short for "Publisher" / "Subscriber" in which a service that wants to publish can create a *topic* and other services that want to listen to events on that *topic* can subscribe.

#### Subscribing
`socket.subscribe` takes a string which is the name of the topic to which you are subscribing this LiveView. When you subscribe to a topic, updates to that topic are sent to the `handleInfo` method of your LiveView.
```ts
const myLiveView = createLiveView(
  mount: async (socket) => {
    // typically want to check the websocket is connected, that is,
    // this isn't an http request
    if (socket.connected) {
      // listen for events on the "my_stuff" topic
      await socket.subscribe("my_stuff");
    }
  },
  ...
  handleInfo: (info, socket) => {
    // handle "my_stuff" events
    if()
    ...
  }
);
```

#### Broadcasting
To broadcast to a topic, you call the `broadcast` method on the implementation (see below) of the PubSub provider. Publishing can and does happen outside of the LiveView implementation for example as part of a data source class or otherwise where it makes sense for your use case.
```ts
import { SingleProcessPubSub } from 'liveviewjs';
// or import { RedisPubSub } from '@liveviewjs/express
// or import { BroadcastChannelPubSub } from '@liveviewjs/deno`
...
// setup your client if necessary (Redis details for example)
const pubSub = new SingleProcessPubSub();

...
// publish: in this case the "some_event" to the "my_stuff" topic
pubSub.publish("my_stuff", { type: "some_event", foo: "bar" });

```

See the `Volunteers` example for a more complete showcase.

#### Configuring Pub/Sub Implementation
LiveViewJS provides three different implementations out of the box for Pub/Sub: `SingleProcessPubSub`, `RedisPubSub`, and `BroadcastChannelPubSub`.  `SingleProcessPubSub` is shipped as part of the `liveviewjs` core library.  `RedisPubSub` is shipped with the `@liveviewjs/express` library and `BroadcastChannelPubSub` is part of the Deno library. `SingleProcessPubSub` only supports Pub/Sub within a single process and is built on top of the `EventEmitter` APIs.  `RedisPubSub` and `BroadcastChannelPubSub` enable developers to support Pub/Sub across multiple server instances.

Part of configuring the server is passing in an instance of the Pub/Sub implementation:
```ts
// Use the SingleProcessPubSub
const liveViewServer = new NodeExpressLiveViewServer(
  ...
  new SingleProcessPubSub(),
  ...
);
...
// Alternatively use a different implementation
const redisPubSub = new RedisPubSub({
  //config
})

const liveViewServer = new NodeExpressLiveViewServer(
  ...
  redisPubSub,
  ...
);
```


### Client-side Javascript
LiveViewJS pages require some client-side javascript to be loaded in the HTML page to parse the `phx-*` attributes,  connect to the server (via websocket), apply the diffs, and handle user interactions.

#### Default Client-side JS via CDN:
You can load the default LiveViewJS client-side by adding the following to your LiveViewJS template:
```html
<script defer type="text/javascript" src="https://cdn.jsdelivr.net/gh/floodfx/liveviewjs@0.3.0/packages/examples/dist/liveviewjs-examples.browser.js">
</script>
```

#### Customizing client-side JS:
  The default typescript for the client-side javascript is the following:
```ts
import NProgress from "nprogress";
import { Socket } from "phoenix";
import "phoenix_html";
import { LiveSocket } from "phoenix_live_view";

// Define the route that websockets will use to connect to your server
const url = "/live";

// Pull out the csrf token from the meta tag
let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");

// Create the LiveSocket
let liveSocket = new LiveSocket(url, Socket, { params: { _csrf_token: csrfToken } });

// Show progress bar on live navigation and form submits (requires NProgress css)
window.addEventListener("phx:page-loading-start", (info) => NProgress.start());
window.addEventListener("phx:page-loading-stop", (info) => NProgress.done());

// connect if there are any LiveViews on the page
liveSocket.connect();

// If you want to expose liveSocket messages in the console for debugging, uncomment the following:
// liveSocket.enableDebug();

// If you want to simulate request latency, you can uncomment the following
// liveSocket.enableLatencySim(1000)

// finally add the liveSocket to the window
(window as any).liveSocket = liveSocket;
```



#### "Hooks" (not the React kind) for anything else
Sometimes you need to do something that is not supported by any of the existing user event bindings or that requires hooking into a client event. LiveView has "Hooks" for these types of situations.

**Note**: The term "Hooks" comes from Phoenix/LiveView which this project is based on and whose client library we are built on. It is in no way related to React Hooks. It is unfortunate that "Hooks" is overloaded but we don't find it very confusing considering how different LiveView is from React.


### File Upload Events
Work in progress!

### Lots of other LiveView examples
We have lots of other, non-trivial examples of LiveViews in the `packages/examples` directory including:
 * [XKCD](/packages/examples/src/liveviews/asyncFetch/) - Browse the latest XKCD comics
 * [Dashboard](/packages/examples/src/liveviews/dashboard/) - A Dashboard that updates every second with random metrics
 * [Volume Control](/packages/examples/src/liveviews/volume/) - Volume Control with keyboard inputs (no actual sound)
 * [Search](/packages/examples/src/liveviews/liveSearch/) - Search for businesses in a city by zip code (try 80204)
 * [Autocomplete](/packages/examples/src/liveviews/autoComplete/) - Autocomplete for businesses in a city by zip code (try 80204)
 * [Sorting](/packages/examples/src/liveviews/sorting/) - A table that is sortable by clicking on the column headers and supports pagination
 * and many more...

You can run these by checking out this repo and navigating to either the `packages/express` or `packages/deno` directory and following the directions in the `README.md` there.

You can also install the examples in your NodeJS app by running:
`npm i -D @liveviewjs/examples`
Check out the code in the `packages/express` directory for example code.

For Deno, the examples are available on DenoLand: (replace VERSION below with the latest version of this library)
`https://deno.land/x/liveviewjs@VERSION/packages/examples/mod.ts`
Check out the code in the `packages/deno` directory for example code.


#### Adding LiveViewJS to your existing app

**Prerequisites to adding LiveViewJS**

 1. Install LiveViewJS in your NodeJS or Deno app
   * NodeJS: `npm i liveviewjs`
   * Deno: Add liveviewjs to your `deps.ts` or `import_map.json` - https://deno.land/x/liveviewjs@VERSION/mod.ts (replace VERSION with the latest version of this library)

**Quick Integration Walkthrough**

Quick start of adding LiveViewJS to your application:

 1. Create one or more `LiveView`s (use `BaseLiveView` as your base class) - Feel free to use an [example](/packages/examples) or include from the `@liveviewjs/examples` package.
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
        <script defer type="text/javascript" src="https://cdn.deno.land/liveviewjs/versions/0.3.0/raw/packages/examples/dist/liveviewjs-examples.browser.js"></script>
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
**That's it!!!** Start your server and start making requests to the LiveView routes!


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
