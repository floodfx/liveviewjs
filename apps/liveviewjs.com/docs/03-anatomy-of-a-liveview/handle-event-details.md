---
sidebar_position: 4
---

# LiveView API - `handleEvent`

`handleEvent` is called automatically by the **LiveViewJS** framework when a user action causes the browser to send
an event to the server (e.g., clicks, keyboard input, form updates, focus/blur, etc.). (More details on
[User Events](/docs/user-events-slash-bindings/overview)). The `handleEvent` function is responsible for updating the
`context` (i.e., state) of the LiveView based on the event.

## `handleEvent` Signature

```ts
handleEvent(event: TEvents, socket: LiveViewSocket<TContext, TInfos>): void | Promise<void>;
```

The example `handleEvent` function below receives the `event` and the `socket` and updates the `count` in the `socket`'s
context based on the `event`'s `type`. In other words, it adds 1 when to `count` when it receives the `increment` event
and subtracts 1 when it receives the `decrement` event:

```ts title="counterLiveView.ts" {13-24}
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
