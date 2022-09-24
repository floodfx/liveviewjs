---
sidebar_position: 7
---

# Push Command

The `push` command sends an event to the server

```typescript
new JS().push(event: string, options?: PushOptions)
```

- `event` - The name of the event to send to the server
- `options` - Options for the command (optional)
  - `target` - An optional selector or component ID to push to
  - `loading` - An optional selector to apply the phx loading classes to
  - `page_loading` - An optional boolean indicating whether to trigger the "phx:page-loading-start" and
    "phx:page-loading-stop" events. Defaults to `false`
  - `value` An optional map of key/value pairs to include in the event's `value` property

Examples

```html
//... in your render function of a LiveView

// push increment event to server
<button phx-click="${new JS().push("increment")}">+</button>

// push decrement event to server
<button phx-click="${new JS().push("decrement")}">-</button>

// push increment event to server with a payload then hide the button
<button phx-click="${new JS().push("increment", value: {foo: "bar"}).hide()}">
  Increment then hide
</button>

// hide the button then push increment event
<button phx-click="${new JS().hide().push("increment")}">Hide then Increment</button>

// push incremenet and show page loading indicator
<button phx-click="${new JS().push("increment", { page_loading: true })}">
  Page Loading Push
</button>
```
