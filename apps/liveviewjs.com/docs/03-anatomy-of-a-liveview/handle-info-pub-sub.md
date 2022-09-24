---
sidebar_position: 9
---

# Pub/Sub with `handleInfo`

Pub/Sub is a common pattern for decoupling processes by allowing messages to be sent to a topic by one process and
received asynchronously by another. **LiveViewJS** (and Phoenix LiveView, for that matter) are built on top of Pub/Sub,
and Pub/Sub is what enables building the real-time, multi-player features with such ease (along with the LiveView
programming model). We will go into more [detail on Pub/Sub](/docs/category/real-time--multi-player) in the Real-Time
Multi-Player docs.

## Example Pub/Sub LiveView

We're going to extend our counter example to use Pub/Sub, which will make it a real-time, multi-player counter. Here is
the code with the Pub/Sub changes highlighted:

```ts title="realtimeCounterLiveView.ts" {3-6,14,17-20,27-28,31-32,36-40}
import { createLiveView, html, SingleProcessPubSub } from "liveviewjs";

// An in-memory count simulating state outside of the LiveView
let count = 0;
// Use a single process pub/sub implementation (for simplicity)
const pubSub = new SingleProcessPubSub();

/**
 * A basic counter that increments and decrements a number.
 */
export const rtCounterLiveView = createLiveView<
  { count: number }, // Define LiveView Context / State
  { type: "increment" } | { type: "decrement" }, // Define LiveView Events
  { type: "counter"; count: number } // Define LiveView Info messages
>({
  mount: (socket) => {
    // init state, set count to current count
    socket.assign({ count });
    // subscribe to counter events
    socket.subscribe("counter");
  },
  handleEvent: (event, socket) => {
    // handle increment and decrement events
    const { count } = socket.context;
    switch (event.type) {
      case "increment":
        // broadcast the new count
        pubSub.broadcast("counter", { count: count + 1 });
        break;
      case "decrement":
        // broadcast the new count
        pubSub.broadcast("counter", { count: count - 1 });
        break;
    }
  },
  handleInfo: (info, socket) => {
    // receive updates from pubsub and update the context
    count = info.count;
    socket.assign({ count });
  },
  render: async (context) => {
    // render the view based on the state
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

:::info We're using a `SingleProcessPubSub` implementation for simplicity. In a real application, you would use a
`RedisPubSub` implementation in NodeJS or a `BroadcastChannelPubSub` implementation in for Deno. See the
[Pub/Sub docs](/docs/real-time-multi-player-pub-sub/overview) for more details. :::

## How it works

- This works just like the `counter.ts` example except we're using Pub/Sub to broadcast the new count to all connected
  clients and subscribe to updates from other clients.
- When a client clicks the increment or decrement button, we broadcast the new count to all connected clients using
  `pubSub.broadcast`.
- The **LiveViewJS** framework automatically routes messages from `pubSub.broadcast` to the `handleInfo` function for
  any LiveView subscribed to the topic.
- In this case, `handleInfo` receives the new count and updates the LiveView context which re-renders the view.

## It's that easy!

In ~10 lines of code, we've built a real-time, multi-player counter! Sure, that isn't particularly useful, but it shows you how easy it is to create real-time, multi-player applications with very little code and effort.
