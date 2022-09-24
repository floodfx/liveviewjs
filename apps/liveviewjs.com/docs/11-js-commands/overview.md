---
sidebar_position: 1
---

# Overview

LiveViewJS user events (clicks, etc) typically trigger a server-side event which updates the state of the LiveView and
re-renders the HTML. Sometimes you want to update the DOM without (or in addition to) initiating a server round trip.
This is where JS Commands come in.

JS Commands support a number of client-side DOM manipulation function that can be used to update the DOM without a
server round trip. These functions are:

- `add_class` - Add css classes to an element including optional transition classes
- `remove_class` - Remove css classes from an element including optional transition classes
- `set_attribute` - Set an attribute on an element
- `remove_attribute` - Remove an attribute from an element
- `show` - Show an element including optional transition classes
- `hide` - Hide an element including optional transition classes
- `toggle` - Toggle the visibility of an element
- `dispatch` - Dispatch a DOM event from an element
- `transition` - Apply transition classes to an element (i.e.,  animate it)
- `push` - Push an event to the LiveView server (i.e.,  trigger a server round trip)

## JS Command Syntax

JS Commands are used in the `render` function of a LiveView or LiveComponent:

```typescript
import { JS } from 'lieviewjs';

//... render function of a LiveView
render() {
  return html`
    <div>
      <button phx-click="${new JS().toggle({ to: "#toggle" })}">Toggle</button>
      <div id="toggle">Toggle Me</div>
    </div>
  `;
}
```

## "Chainable" (i.e.,  fluent) Syntax

JS Commands are "chainable" (i.e.,  fluent) so you can chain multiple commands together as needed and they will be
executed in the order they are called:

```typescript
import { JS } from 'lieviewjs';

//... render function of a LiveView
render() {
  // hide the button then push the "increment" event to the server
  return html`
    <div>
      <button phx-click="${new JS().hide().push("increment")}">Increment</button>
    </div>
  `;
}
```

## Example JS Commands LiveView

See `packages/examples/src/liveviews/jsCommands` for a working, complete set of examples of using JS Commands.

More details on each JS Command can be found in the following sections.
