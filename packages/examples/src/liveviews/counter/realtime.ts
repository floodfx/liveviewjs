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
