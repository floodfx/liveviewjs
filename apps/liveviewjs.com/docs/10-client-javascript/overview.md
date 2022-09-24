---
sidebar_position: 1
---

# Client-side Javascript

LiveViewJS pages do, in fact, require some client-side javascript to be loaded as part of the HTML page. This
client-side javascript handles parsing the `phx-*` attributes, connecting to the server (via websocket), appling the
diffs, and turning user interactions into events, among other things.

Let's look at the client-side javascript in more detail.

## Default client-side JS:

The default Typescript that is compiled into the client-side javascript loaded by **LiveViewJS** is the following:

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

:::info The libraries used in **LiveViewJS** are exactly the same libraries used in Phoenix LiveView. Beyond ensuring we
don't reinvent the wheel, this provides **LiveViewJS** with battle-tested, robust code that has proven extremely
reliable. :::

## Walkthrough of the client-side JS

Let's walk through the client-side JS in more detail.

### Imports

First, we are importing the `NProgress` library which is used to show a progress bar when the page is loading. We are
also importing the `Socket` and `LiveSocket` classes from the `phoenix` and `phoenix_live_view` libraries along with the
`phoenix_html` library.

```ts
import NProgress from "nprogress";
import { Socket } from "phoenix";
import "phoenix_html";
import { LiveSocket } from "phoenix_live_view";
...
```

### LiveView Websocket Route

Next, we define the route that websockets will use to connect to your server. All websockets will be routed through this
URL. From there, **LiveViewJS** uses the page URL to determine which LiveView to route the connection to. If you change
this URL, you will need to change the server-side code that handles the websocket connection.

```ts
...
// Define the route that websockets will use to connect to your server
const url = "/live";
...
```

### CSRF Token

Next, we pull out the CSRF token from the meta tag. This is used to authenticate the websocket connection.

```ts
...
// Pull out the csrf token from the meta tag
let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
...
```

### Create the LiveSocket

Then, we create the LiveSocket. This is the object that handles the websocket connection and all the LiveView logic. We
pass in the `url`, `Socket`, and any other options we want to configure the LiveSocket with.

```ts
...
// Create the LiveSocket
let liveSocket = new LiveSocket(url, Socket, { params: { _csrf_token: csrfToken } });
...
```

:::tip The options that we can pass into the LiveSocket are:

- `bindingPrefix` - the prefix to use for phoenix bindings. Defaults "phx-"
- `params` - the connect_params to pass to the view's mount callback. May be a literal object or closure returning an
  object. When a closure is provided, the function receives the view's element.
- `hooks` – a reference to a user-defined hooks namespace, containing client callbacks for server/client interop. (We'll
  cover Hooks in a later section)
- `uploaders` – a reference to a user-defined uploaders namespace, containing client callbacks for client-side
  direct-to-cloud uploads. (LiveViewJS currently does not support user-defined uploaders but we plan to add this in the
  future) :::

### Progress Bar

Next, we add event listeners to show a progress bar when the page is loading. This requires the `NProgress` library and
the `NProgress` css.

```ts
...
// Show progress bar on live navigation and form submits (requires NProgress css)
window.addEventListener("phx:page-loading-start", (info) => NProgress.start());
window.addEventListener("phx:page-loading-stop", (info) => NProgress.done());
...
```

You could swap NPorgress out for any other progress bar library you want like
[topbar](http://buunguyen.github.io/topbar/). If you did that you would have to update the event listeners to match the
events that your progress bar library uses.

### Connect to the LiveSocket

Lastly, we connect to the LiveSocket. This will connect to the websocket and start the LiveView process.

```ts
...
// connect if there are any LiveViews on the page
liveSocket.connect();
...
// add the liveSocket to the window
(window as any).liveSocket = liveSocket;
```

### Debugging and Latency Simulation

There are a couple of lines that are commented out by default. If you want to expose liveSocket messages in the console
for debugging or turn on latency simulation, you can uncomment the following lines:

```ts
...
// liveSocket.enableDebug();
// liveSocket.enableLatencySim(1000)
...
```

### Default client-side JS is good start

For the most part, you shouldn't need to change the client-side JS especially at first. As you build more LiveViews you
might run into a need to do some more client-side DOM manipulation or handle events pushed from the server. In these
cases, you may need to add what is called a "Hook". We'll cover Hooks in the next section.

:::caution LiveView "Hooks" are a completely different concept from "Hooks" in React. LiveView Hooks are a way to add
custom client-side logic to your LiveView. Unfortunately, sometimes naming conflicts like this happen. Just remember
that LiveView Hooks are not the same as React Hooks. :::
