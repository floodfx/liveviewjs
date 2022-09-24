---
sidebar_position: 3
---

# LiveView API - `mount`

`mount` is called by the **LiveViewJS** runtime when your LiveView is first mounted
([over HTTP and Websocket](/docs/lifecycle-of-a-liveview/intro)). `mount` is where you initialize the context (i.e.
state) of your LiveView (using `socket.assign`) and otherwise configure the LiveView. The
[webserver integrations](/docs/webserver-integration/overview) automatically make session data available via the
`session` which can be useful if you need to use data from the user's session. Don't worry about `params` for now. We'll
cover that later.

## `mount` Signature

```ts
mount(
  socket: LiveViewSocket<TContext, TInfos>,
  session: Partial<SessionData>,
  params: LiveViewMountParams
): void | Promise<void>;
```

As you can see in the `counterLiveView.ts` below, `mount` initializes the `count` to `0` (and doesn't use the `session`
or `params`):

```ts title="counterLiveView.ts" {9-12}
import { createLiveView, html } from "liveviewjs";
/**
 * A basic counter that increments and decrements a number.
 */
export const counterLiveView = createLiveView<
  { count: number }, // Define LiveView Context / State
  { type: "increment" } | { type: "decrement" } // Define LiveView Events
>({
  // Setup / initialize the LiveView Context (i.e.,  set count to 0)
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
  render: (context) => {
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

:::info The `LiveViewSocket` is passed into all methods except for `render`. `LiveViewSocket` is the swiss army knife of
LiveViewJS. We will cover its [API in more detail](/docs/liveview-socket/liveviewsocket-api) shortly. :::
