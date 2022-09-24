---
sidebar_position: 2
---

# Add/Remove Class Commands

Add or remove css classes including optional transition classes from an element using the `add_class` and `remove_class`
commands.

## Add Class Command

The `add_class` command adds one or more css classes to an element.

```typescript
new JS().add_class(names: string, options?: ClassOptions)
```

- `names` - A string of space separated css class names to add to the element
- `options` - Options for the command (optional)
  - `to` - A css selector to identify the element to add the class to. Defaults to the element that the JS Command is
    attached to.
  - `time` - The time (in milliseconds) over which to apply the transition options. Defaults to 200
  - `transition` - The string of classes to apply before adding the classes, or a 3-tuple containing the transition
    class, the class to apply to start the transition, and the class to apply to end the transition. e.g.,  ["ease-out
    duration-300", "opacity-0", "opacity-100"]

Examples

```html
//... in your render function of a LiveView

// add the "bg-blue-500" class to this button element on click
<button phx-click="${new JS().add_class("bg-blue-500")}">Add Class</button>

// add the "bg-blue-500" class to the element with id="target" on click
<button phx-click="${new JS().add_class("bg-blue-500", {to: "#target"})}">Add Class</button>
<div id="target">My Target</div>

// add the "bg-blue-500" class to the element with id="target2" on click with a transition over 400ms
<button phx-click="${new JS().add_class("bg-blue-500", {to: "#target2", transition: ["ease-out duration-300", "opacity-0", "opacity-100"], time: 400})}">Add Class</button>
<div id="target2">My Target2</div>
```

## Remove Class Command

The `remove_class` command removes one or more css classes from an element.

```typescript
new JS().remove_class(names: string, options?: ClassOptions)
```

- `names` - A string of space separated css class names to remove from the element
- `options` - Options for the command (optional)
  - `to` - A css selector to identify the element to remove the class from. Defaults to the element that the JS Command
    is attached to.
  - `time` - The time (in milliseconds) over which to apply the transition options. Defaults to 200
  - `transition` - The string of classes to apply before removing the classes, or a 3-tuple containing the transition
    class, the class to apply to start the transition, and the class to apply to end the transition. e.g.,  ["ease-out
    duration-300", "opacity-0", "opacity-100"]

Examples

```html
//... in your render function of a LiveView

// remove the "bg-blue-500" class from this button element on click
<button class="bg-blue-500" phx-click="${new JS().remove_class("bg-blue-500")}">Remove Class</button>

// remove the "bg-blue-500" class from the element with id="target" on click
<button phx-click="${new JS().remove_class("bg-blue-500", {to: "#target"})}">Remove Class</button>
<div id="target" class="bg-blue-500">My Target</div>

// remove the "bg-blue-500" class from the element with id="target2" on click with a transition over 400ms
<button phx-click="${new JS().remove_class("bg-blue-500", {to: "#target2", transition: ["ease-out duration-300", "opacity-0", "opacity-100"], time: 400})}">Remove Class</button>
<div id="target2" class="bg-blue-500">My Target2</div>
```
