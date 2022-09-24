---
sidebar_position: 4
---

# Show/Hide/Toggle Element Commands

The `show`, `hide`, and `toggle` commands are used to show, hide, or toggle the visibility of an element including css
transition classes. The element is identified by a CSS selector.

## Show Command

The `show` command makes the target element visible

```typescript
new JS().show(options?: ShowOptions)
```

- `options` - Options for the command (optional)
  - `to` - A css selector to identify the element make visible. Defaults to the element that the JS Command is attached
    to.
  - `time` - The time (in milliseconds) over which to apply the transition options. Defaults to 200
  - `transition` - The string of classes to apply before showing the element, or a 3-tuple containing the transition
    class, the class to apply to start the transition, and the class to apply to end the transition. e.g.,  ["ease-out
    duration-300", "opacity-0", "opacity-100"]
  - `display` - The display type to apply to the element. Defaults to "block"

Examples

```html
//... in your render function of a LiveView

// show the target element on click
<button phx-click="${new JS().show({ to: "#show_me" })}">Show</button>
<div id="show_me" style="display: none;">Show Me</div>

// show the target element with a transition on click
<button phx-click="${new JS().show({
  to: "#show_me2",
  transition: ["ease-out duration-300", "opacity-0", "opacity-100"],
  time: 400
})}">Show w/ Transition</button>
<div id="show_me2" style="display: none;">Show Me2</div>
```

## Hide Command

The `hide` command makes the target element hidden

```typescript
new JS().hide(options?: ShowOptions)
```

- `options` - Options for the command (optional)
  - `to` - A css selector to identify the element to hide. Defaults to the element that the JS Command is attached to.
  - `time` - The time (in milliseconds) over which to apply the transition options. Defaults to 200
  - `transition` - The string of classes to apply before hiding the element, or a 3-tuple containing the transition
    class, the class to apply to start the transition, and the class to apply to end the transition. e.g.,  ["ease-out
    duration-300", "opacity-100", "opacity-0"]

Examples

```html
//... in your render function of a LiveView

// hide the target element on click
<button phx-click="${new JS().hide({ to: "#hide_me" })}">Hide</button>
<div id="hide_me">Hide Me</div>

// hide the target element with a transition on click
<button phx-click="${new JS().hide({
  to: "#hide_me",
  transition: ["ease-out duration-300", "opacity-100", "opacity-0"],
  time: 400
})}">Hide w/ Transition</button>
<div id="hide_me2">Hide Me2</div>
```

## Toggle Command

The `toggle` command toggles the visibility of the target element

```typescript
new JS().toggle(options?: ToggleOptions)
```

- `options` - Options for the command (optional)
  - `to` - A css selector to identify the element to toggle. Defaults to the element that the JS Command is attached to.
  - `time` - The time (in milliseconds) over which to apply the transition options. Defaults to 200
  - `in` - The string of classes to apply when toggling to visible, or a 3-tuple containing the transition class, the
    class to apply to start the transition, and the class to apply to end the transition. e.g.,  ["ease-out duration-300",
    "opacity-0", "opacity-100"]
  - `out` - The string of classes to apply when toggling to hidden, or a 3-tuple containing the transition class, the
    class to apply to start the transition, and the class to apply to end the transition. e.g.,  ["ease-out duration-300",
    "opacity-100", "opacity-0"]
  - `display` - The display type to apply to the element when toggling to visible. Defaults to "block"

Examples

```html
//... in your render function of a LiveView

// toggle the target element on click
<button phx-click="${new JS().toggle({ to: "#toggle_me" })}">Toggle</button>
<div id="toggle_me">Toggler</div>

// toggle the target element with a transition in/out on click
<button phx-click="${new JS().toggle({
  to: "#toggle_me2",",
  in: ["ease-out duration-300", "opacity-0", "opacity-100"],
  out: ["ease-out duration-300", "opacity-100", "opacity-0"],
  time: 400
})}">Toggle w/ Transition</button>
<div id="toggle_me2">Toggle Me 2</div>
```
