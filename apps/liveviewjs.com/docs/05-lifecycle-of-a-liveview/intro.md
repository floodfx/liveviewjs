---
sidebar_position: 1
---

# Lifecycle of a LiveView

We are going to look at the lifecycle of LiveViews in detail to see when each LiveView method (e.g.,  `mount`,
`handleEvent`, `render`, etc) are called during the lifecycle so you can better understand how to use them.

## HTTP and Websocket

There are two major parts of a lifecycle:

1.  HTTP request phase
2.  Websocket phase

### HTTP Request Phase

Just like any other web page, all LiveViews start with a HTTP request to a URL (e.g.,  `GET /my-liveview`) and this route
is served by a webserver (e.g.,  Express). If that route is a LiveView route, the webserver hands off the request to the
**LiveViewJS** library for processing.

The **LiveViewJS** library then creates a new LiveView instance and starts the HTTP request phase which consists of:

1. `mount` - The LiveView is mounted and the context is initialized
2. `handleParams` - The LiveView is given a chance to handle any params passed in the URL (e.g.
   `GET /my-liveview?foo=bar`)
3. `render` - The LiveView is rendered based on the `context` and the HTML is returned to the webserver

The webserver then returns the HTML to the browser. Below is a sequence diagram showing the HTTP request phase:

![Http Request Phase](/img/diagrams/liveview-lifecycle-http-phase.svg)

#### Advantages of HTML

The advantage of rendering the HTML initially is:

- "First paint" is extremely fast (it's just HTML)
- No waiting for MBs of JS to download
- Renders even if JS is disabled
- Search engine friendly (again it is only HTML)

### Websocket Phase

After the initial HTTP request and response, the LiveView client javascript automatically connects to the LiveView
server via a websocket. The websocket is used to send events from the browser to the LiveView server and to receive DOM
patches from the LiveView server. The websocket phase breaks down into three parts:

1. "Websocket Join" - Establish the websocket connection and run the initial LiveView lifecycle methods
2. "Interactive" - The LiveView is interactive and can respond to user events or update based on server events
3. "Shutdown" - The LiveView automatically cleans up and shuts down resources

#### Websocket Join Phase

During the "Websocket Join" phase the LiveView runs the same initiliation methods as the HTTP request phase:

1. `mount` - The LiveView is mounted and the context is initialized
2. `handleParams` - The LiveView is given a chance to handle any params passed in the URL (e.g.
   `GET /my-liveview?foo=bar`)
3. `render` - The LiveView is rendered based on the `context`

But instead of sending back a full HTML page, the LiveView sends back a datastructure that breaks down the HTML into
"static" and "dynamic" parts. This data structure allows future "diffs" to be sent to the client to update the DOM.
Below is a sequence diagram showing the "Websocket Join" phase:

![Websocket Join](/img/diagrams/liveview-lifecycle-websocket-join.svg)

:::info You may have noticed both the HTTP request phase and the Websocket Join phase run the same methods. This is
because the LiveView is initialized (`mount` => `handleParams` => `render`) in both phases. The HTTP phase doesn't
retain any state but the Websocket phase does keep state in memory so needs to re-run the initialization methods.
Importantly, you may also want to handle HTTP vs Websocket differently in your LiveView so calling the initialization
methods in both phases is important. :::

#### Interactive Phase

Once the Websocket has been established, the LiveView is in the "Interactive" phase. In this phase the LiveView can
respond to user events and server events.

**User events** (clicks, form updates/submissions, keyboard input, etc) are sent from the browser to the LiveView server
via the websocket, routed to `handleEvent` then `render`. **LiveViewJS** then calculates the "diffs", sends those diffs
back to the client which automatically applies them to the DOM.

**Server events** (from `socket.sendInfo` or Pub/Sub subscriptions) are automatically received in the LiveView server,
routed to `handleInfo` then to `render` Similar to user events, **LiveViewJS** then calculates the "diffs", sends those
diffs back to the client which automatically applies them to the DOM.

Below is a sequence diagram showing the "Interactive" phase:

![Interactive](/img/diagrams/liveview-lifecycle-user-and-server-events.svg)

### Other Processes / Phases

LiveViews have a couple of other processes that are important to understand but are automatically handled by
**LiveViewJS** so you don't need to worry about them.

1. "Heartbeat" - The LiveView clientr sends a heartbeat message to the server every 30 seconds to ensure the websocket
   connection is still alive
2. "Shutdown" - The LiveView automatically cleans up and shuts down resources

Here are a couple of sequence diagrams showing the "Heartbeat" and "Shutdown" phases:

#### Heartbeat

![Heartbeat](/img/diagrams/liveview-lifecycle-heartbeat.svg)

#### Shutdown

![Shutdown](/img/diagrams/liveview-lifecycle-shutdown.svg)
