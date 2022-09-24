---
sidebar_position: 5
---

# Dispatch Command

The `dispatch` command dispatches a DOM event from the target element

```typescript
new JS().dispatch(event: string, options?: DispatchOptions)
```

- `event` - The name of the event to dispatch
- `options` - Options for the command (optional)
  - `to` - An optional css selector to identify the element from which to dispatch. Defaults to the element that the JS
    Command is attached to.
  - `detail` - A optional map of key/value pairs to include in the event's `detail` property
  - `bubbles` - A optional boolean indicating whether the event should bubble up the DOM. Defaults to `true`

**Note**: All events dispatched are of a type CustomEvent, with the exception of "click". For a "click", a MouseEvent is
dispatched to properly simulate a UI click.

For emitted CustomEvent's, the event detail will contain a dispatcher, which references the DOM node that dispatched the
JS event to the target element.

Examples

```html
//... in your render function of a LiveView

// dispatch a click
<button phx-click="${new JS().dispatch("click", { to: "#dispatch" })}">Dispatch Click</button>

// dispatch a custom event
<button phx-click="${new JS().dispatch("custom", { to: "#dispatch", detail: { foo: "bar" } })}">
  Dispatch Custom
</button>
<div id="dispatch">Dispatch Target</div>
```
