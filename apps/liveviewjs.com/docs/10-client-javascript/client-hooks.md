---
sidebar_position: 2
---

# "Hooks" (not the React kind)

Sometimes you need to do something that is not supported by any of the existing user event bindings or that requires
hooking into a client-side DOM event. LiveView has "Hooks" for these types of situations.

:::caution The term "Hooks" comes from Phoenix/LiveView which this project is based on and whose client library we are
utilizing. LiveView "Hooks" are in no way related to React "Hooks". It is unfortunate that "Hooks" is overloaded but we
don't find it very confusing considering how different LiveView is from React. :::

## `phx-hook` Attribute

The `phx-hook` attribute is used to attach a LiveView "Hook" to a DOM element. The value of the attribute is the name of
the hook (which must be registered in the client-side `LiveSocket`). For example, if you wanted to attach a hook named
`MyHook` to a button, you would do the following:

```html
<button phx-hook="MyHook">Click Me</button>
```

## Registering Hooks

As noted above, you must register the hook in the client-side `LiveSocket` before you can use it. You do this by first
defining the hook and then by adding the hook to the `hooks` option when you create the `LiveSocket`:

```ts
// Define the hook
const Hooks = {
  MyHook: {
    mounted() {
      // do something when the element is mounted
      console.log("MyHook mounted");
    }
  }
}
...
// Add the hook to the LiveSocket
let liveSocket = new LiveSocket("/live", Socket, {
  hooks: { MyHook }
});
...
```

This hook will simply print a message to the console when the element is mounted.

## Hook Lifecycle

Hooks have the following lifecycle methods:

- `mounted` - the element has been added to the DOM and its server LiveView has finished mounting
- `beforeUpdate` - the element is about to be updated in the DOM. Note: any call here must be synchronous as the
  operation cannot be deferred or cancelled.
- `updated` - the element has been updated in the DOM by the server
- `destroyed` - the element has been removed from the page, either by a parent update, or by the parent being removed
  entirely
- `disconnected` - the element's parent LiveView has disconnected from the server
- `reconnected` - the element's parent LiveView has reconnected to the server

## Hook Context

Inside the hook lifecycle methods you can reference many additional properties and methods for the hook including:

- `el` - attribute referencing the bound DOM node liveSocket - the reference to the underlying LiveSocket instance
- `pushEvent(event, payload, (reply, ref) => ...)` - method to push an event from the client to the LiveView server
- `pushEventTo(selectorOrTarget, event, payload, (reply, ref) => ...)` - method to push targeted events from the client
  to LiveViews and LiveComponents. It sends the event to the LiveComponent or LiveView the selectorOrTarget is defined
  in, where its value can be either a query selector or an actual DOM element. If the query selector returns more than
  one element it will send the event to all of them, even if all the elements are in the same LiveComponent or LiveView.
- `handleEvent(event, (payload) => ...)` - method to handle an event pushed from the server
- `upload(name, files)` - method to inject a list of file-like objects into an uploader.
- `uploadTo(selectorOrTarget, name, files)` - method to inject a list of file-like objects into an uploader. The hook
  will send the files to the uploader with name defined by allow_upload/3 on the server-side. Dispatching new uploads
  triggers an input change event which will be sent to the LiveComponent or LiveView the selectorOrTarget is defined in,
  where its value can be either a query selector or an actual DOM element. If the query selector returns more than one
  live file input, an error will be logged.

:::tip The `@types/phoenix_live_view` package provides a (currently incomplete) type definition for a hook. You can use
it by importing the `ViewHook` type from the `phoenix_live_view` package.

```ts
import { ViewHook } from "phoenix_live_view";
```

:::
