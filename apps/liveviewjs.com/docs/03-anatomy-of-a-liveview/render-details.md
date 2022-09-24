---
sidebar_position: 3
---

# LiveView API - `render`

`render` is responsible for taking the `context` (i.e., state) of the LiveView and generating the HTML/CSS for the
client. The **LiveViewJS** framework automatically passes the current `context` of the LiveView into `render` along with
`meta` data (things like the csrfToken, page url, etc.). It uses the `html` method to generate the HTML/CSS for the
client.

## `render` Signature

```ts
render(context: TContext, meta: LiveViewMeta<TEvents>): LiveViewTemplate | Promise<LiveViewTemplate>;
```

The example `render` function below takes the `count` from the context and renders the HTML/CSS for the client:

```ts title="counterLiveView.ts" {25-35}
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

:::info You might have noticed the `phx-click` attributes present in the `<button>` elements in the example above. These
are examples of attributes (a.k.a "bindings") that are added to HTML elements that initiate server events based on user
interaction. There are four main types of bindings: click, form, key, focus/blur. We will cover them in more detail
in the [section on User Events](/docs/user-events-slash-bindings/overview). :::
