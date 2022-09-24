---
sidebar_position: 1
---

# LiveView API

:::note We are going to be using Typescript in our examples because **LiveViewJS** is very thoroughly typed, which
provides great type hints, autocompletion, etc. If the typescript syntax is confusing, just ignore it and focus on the
code. :::

## LiveView API is Five Methods

The **LiveViewJS** API is extremely simple but very flexible. There are only five methods that make up the LiveView API:
`mount`, `render`, `handleEvent`, `handleInfo`, and `handleParams`. Technically, only `render` is required. The other
four methods (`mount`, `handleEvent`, `handleInfo`, `handleParams`) are optional but usually `mount` and at least one
other `handle` method is defined to enable a dynamic experience.

:::info The smallest, valid LiveView only defines `render` like so:

```ts
const helloLiveView = createLiveView({
  render: () => html`Hello World`,
});
```

While "valid" a LiveView like this is not very useful nor particularly exciting. Let's look at a more useful example.
:::

## Example LiveView Implementation

It's helpful to look at a simple LiveView example to see how the LiveView API works. Here is a simple LiveView that
renders a counter and has buttons to increment and decrement the counter:

```ts title="counterLiveView.ts"
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

Before we look at the five LiveView methods a very quick aside on the first line of the example above:

```ts
import { createLiveView, html } from "liveviewjs";
```

## `createLiveView` helper

LiveViewJS provides various helpers to create and implement LiveViews. The `createLiveView` function is the canonical
way to define the various functions that make up a LiveView (`mount`, `render` etc) and supports typing the LiveView via
Typescript annotations `TContext`, `TEvents`, and `TInfo`.

## `html` helper

The `html` function is a tagged template literal that allows you to write HTML with dynamic content in a very normal way
using javascript
[template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). The `html` tag
handles escaping content to prevent injection attacks but just as importantly, the `html` tag also
(transparently) creates the data structure necessary to efficiently calculate diffs between the current HTML and the new
HTML. This is what allows **LiveViewJS** to efficiently update the DOM with only the changes.

Let's take a closer look at `mount`, `render`, `handleEvent`, `handleInfo`, and `handleParams` methods in the next
sections.
