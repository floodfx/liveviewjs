## File Uploads

LiveViewJS enables developers to create great user experiences including file uploading with preview images, live progress updates, drag-and-drop support, and more all out of the box with very little effort.

### Highlights

* `add_class` - Add css classes to an element including optional transition classes
* `remove_class` - Remove css classes from an element including optional transition classes
* `set_attribute` - Set an attribute on an element
* `remove_attribute` - Remove an attribute from an element
* `show` - Show an element including optional transition classes
* `hide` - Hide an element including optional transition classes
* `toggle` - Toggle the visibility of an element
* `dispatch` - Dispatch a DOM event from an element
* `transition` - Apply transition classes to an element (i.e. animate it)
* `push` - Push an event to the LiveView server (i.e. trigger a server round trip)

### JS Command Syntax
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

### "Chainable" (i.e. fluent) Syntax
JS Commands are "chainable" (i.e. fluent) so you can chain multiple commands together as needed and they will be executed in the order they are called:
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

### Example JS Commands LiveView
See `packages/examples/src/liveviews/jsCommands` for a working, complete set of examples of using JS Commands.  These examples run on top of express and deno: see the "Run the LiveViewJS Examples in 30 seconds" section of the README for details on how to run them.

## More Details on JS Commands

### Add Class Command
The `add_class` command adds one or more css classes to an element.  
```typescript
new JS().add_class(names: string, options?: ClassOptions)
``` 
* `names` - A string of space separated css class names to add to the element
* `options` - Options for the command (optional)
  * `to` - A css selector to identify the element to add the class to.  Defaults to the element that the JS Command is attached to.
  * `time` - The time (in milliseconds) over which to apply the transition options. Defaults to 200   
  * `transition` - The string of classes to apply before adding the classes, or a 3-tuple containing the transition class, the class to apply to start the transition, and the class to apply to end the transition. e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]

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

### Remove Class Command
The `remove_class` command removes one or more css classes from an element.  
```typescript
new JS().remove_class(names: string, options?: ClassOptions)
``` 
* `names` - A string of space separated css class names to remove from the element
* `options` - Options for the command (optional)
  * `to` - A css selector to identify the element to remove the class from.  Defaults to the element that the JS Command is attached to.
  * `time` - The time (in milliseconds) over which to apply the transition options. Defaults to 200   
  * `transition` - The string of classes to apply before removing the classes, or a 3-tuple containing the transition class, the class to apply to start the transition, and the class to apply to end the transition. e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]

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

### Set Attribute Command
The `set_attribute` command add or updates a single attribute on the target element.  
```typescript
new JS().set_attribute(attr: [string, string], options?: AttributeOptions)
``` 
* `attr` - the 2-tuple of the attribute name and value to set
* `options` - Options for the command (optional)
  * `to` - A css selector to identify the element to set the attribute on.  Defaults to the element that the JS Command is attached to.  

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

### Remove Attribute Command
The `remove_attribute` command removes a single attribute from the target element.  
```typescript
new JS().remove_attribute(attr: string, options?: AttributeOptions)
``` 
* `attr` - the attribute name to remove
* `options` - Options for the command (optional)
  * `to` - A css selector to identify the element to remove the attribute from.  Defaults to the element that the JS Command is attached to.  

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

### Show Command
The `show` command makes the target element visible
```typescript
new JS().show(options?: ShowOptions)
``` 
* `options` - Options for the command (optional)
  * `to` - A css selector to identify the element make visible.  Defaults to the element that the JS Command is attached to.
  * `time` - The time (in milliseconds) over which to apply the transition options. Defaults to 200   
  * `transition` - The string of classes to apply before showing the element, or a 3-tuple containing the transition class, the class to apply to start the transition, and the class to apply to end the transition. e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]
  * `display` - The display type to apply to the element. Defaults to "block"

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

### Hide Command
The `hide` command makes the target element hidden
```typescript
new JS().hide(options?: ShowOptions)
``` 
* `options` - Options for the command (optional)
  * `to` - A css selector to identify the element to hide.  Defaults to the element that the JS Command is attached to.
  * `time` - The time (in milliseconds) over which to apply the transition options. Defaults to 200   
  * `transition` - The string of classes to apply before hiding the element, or a 3-tuple containing the transition class, the class to apply to start the transition, and the class to apply to end the transition. e.g. ["ease-out duration-300", "opacity-100", "opacity-0"]

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

### Toggle Command
The `toggle` command toggles the visibility of the target element
```typescript
new JS().toggle(options?: ToggleOptions)
``` 
* `options` - Options for the command (optional)
  * `to` - A css selector to identify the element to toggle.  Defaults to the element that the JS Command is attached to.
  * `time` - The time (in milliseconds) over which to apply the transition options. Defaults to 200   
  * `in` - The string of classes to apply when toggling to visible, or a 3-tuple containing the transition class, the class to apply to start the transition, and the class to apply to end the transition. e.g. ["ease-out duration-300", "opacity-0", "opacity-100"]
  * `out` - The string of classes to apply when toggling to hidden, or a 3-tuple containing the transition class, the class to apply to start the transition, and the class to apply to end the transition. e.g. ["ease-out duration-300", "opacity-100", "opacity-0"]
  * `display` - The display type to apply to the element when toggling to visible. Defaults to "block"

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

### Dispatch Command
The `dispatch` command dispatches a DOM event from the target element
```typescript
new JS().dispatch(event: string, options?: DispatchOptions)
``` 
* `event` - The name of the event to dispatch
* `options` - Options for the command (optional)
  * `to` - An optional css selector to identify the element from which to dispatch.  Defaults to the element that the JS Command is attached to.
  * `detail` - A optional map of key/value pairs to include in the event's `detail` property
  * `bubbles` - A optional boolean indicating whether the event should bubble up the DOM. Defaults to `true`

**Note**: All events dispatched are of a type CustomEvent, with the exception of "click". For a "click", a MouseEvent is dispatched to properly simulate a UI click.

For emitted CustomEvent's, the event detail will contain a dispatcher, which references the DOM node that dispatched the JS event to the target element.

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

### Transition Command
The `transition` command dispatches a DOM event from the target element
```typescript
new JS().transition(transition: Transition, options?: TransitionOptions)
``` 
* `transition` - The string of classes to apply to the element, or a 3-tuple containing the transition class, the class to apply to start the transition, and the class to apply to end the transition. e.g. ["ease-out duration-300", "opacity-100", "opacity-0"]
* `options` - Options for the command (optional)
  * `to` - An optional css selector to identify the element from which to transition.  Defaults to the element that the JS Command is attached to.
  * `time` - The time (in milliseconds) over which to apply the transition options. Defaults to 200

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

### Push Command
The `push` command sends an event to the server
```typescript
new JS().push(event: string, options?: PushOptions)
``` 
* `event` - The name of the event to send to the server
* `options` - Options for the command (optional)
  * `target` - An optional selector or component ID to push to
  * `loading` - An optional selector to apply the phx loading classes to
  * `page_loading` - An optional boolean indicating whether to trigger the "phx:page-loading-start" and "phx:page-loading-stop" events. Defaults to `false`
  * `value` An optional map of key/value pairs to include in the event's `value` property

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




