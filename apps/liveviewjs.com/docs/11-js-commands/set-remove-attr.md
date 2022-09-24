---
sidebar_position: 3
---

# Set/Remove Attribute Commands

Set or remove an attribute from an HTML element using the `set_attribute` and `remove_attribute` commands.

## Set Attribute Command

The `set_attribute` command add or updates a single attribute on the target element.

```typescript
new JS().set_attribute(attr: [string, string], options?: AttributeOptions)
```

- `attr` - the 2-tuple of the attribute name and value to set
- `options` - Options for the command (optional)
  - `to` - A css selector to identify the element to set the attribute on. Defaults to the element that the JS Command
    is attached to.

Examples

```html
//... in your render function of a LiveView

// set the "disabled" attribute to on the target button element on click
<button phx-click="${new JS().set_attribute(["disabled", ""], { to: "#target" })}">Set Disabled</button>
<button id="target">Target</button>

// set the "aria-expanded" attribute to "true" on the target element on click
<button phx-click={new JS().set_attribute(["aria-expanded", "true"], to: "#dropdown")}>
  Expand Dropdown
</button>
<div id="dropdown" aria-expanded="false">Dropdown</div>
```

## Remove Attribute Command

The `remove_attribute` command removes a single attribute from the target element.

```typescript
new JS().remove_attribute(attr: string, options?: AttributeOptions)
```

- `attr` - the attribute name to remove
- `options` - Options for the command (optional)
  - `to` - A css selector to identify the element to remove the attribute from. Defaults to the element that the JS
    Command is attached to.

Examples

```html
//... in your render function of a LiveView

// remove the "disabled" attribute from the target button element on click
<button phx-click="${new JS().remove_attribute("disabled", { to: "#target" })}">Remove Disabled</button>
<button id="target" disabled>Target</button>

// remove the "aria-expanded" attribute from the target element on click
<button phx-click={new JS().remove_attribute("aria-expanded", to: "#dropdown")}>
  Close Dropdown
</button>
<div id="dropdown" aria-expanded="true">Dropdown</div>
```
