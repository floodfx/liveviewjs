---
sidebar_position: 6
---

# Transition Command

The `transition` command dispatches a DOM event from the target element

```typescript
new JS().transition(transition: Transition, options?: TransitionOptions)
```

- `transition` - The string of classes to apply to the element, or a 3-tuple containing the transition class, the class
  to apply to start the transition, and the class to apply to end the transition. e.g.,  ["ease-out duration-300",
  "opacity-100", "opacity-0"]
- `options` - Options for the command (optional)
  - `to` - An optional css selector to identify the element from which to transition. Defaults to the element that the
    JS Command is attached to.
  - `time` - The time (in milliseconds) over which to apply the transition options. Defaults to 200

Examples

```html
//... in your render function of a LiveView

// transition the target element
<button
  phx-click="${new JS()
    .transition("fade-in-scale", {
      to: "#transition",
    })
    .show({ to: "#transition", transition: "fade-in-scale" })}">
  Transition In
</button>
<button
  phx-click="${new JS()
    .transition("fade-out-scale", {
      to: "#transition",
    })
    .hide({ to: "#transition", transition: "fade-out-scale" })}">
  Transition Out
</button>
<div id="transition">Transition Target</div>

// transition button with a shake
<button phx-click="${new JS().transition("shake")}">Shake</button>
```
