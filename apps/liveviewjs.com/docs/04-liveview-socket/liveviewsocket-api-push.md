---
sidebar_position: 3
---

# LiveViewSocket API - Push

There are various methods for "pushing" data from the server to the client outside of `render` and updating the URL of
the LiveView.

## LiveViewSocket Properties and Methods

| Name                                                                                             | Description                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pushEvent(pushEvent: AnyLivePushEvent): void;`                                                  | Pushes and event (possibly with data) from the server to the client. Requires either a `window.addEventListener` defined for that event or a client `Hook` to be defined and to be listening for the event via `this.handleEvent` callback.                                         |
| `pushPatch(path: string, params?: URLSearchParams, replaceHistory?: boolean): Promise<void>;`    | Updates the LiveView's browser URL with the given path and query parameters.                                                                                                                                                                                                        |
| `pushRedirect(path: string, params?: URLSearchParams, replaceHistory?: boolean): Promise<void>;` | Shutdowns the current LiveView and loads another LiveView in its place without reloading the whole page (i.e.,  making a full HTTP request). Can be used to remount the current LiveView if need be. Use `pushPatch` to update the current LiveView without unloading and remounting. |

## Pushing Events

An event is any JSON object with a `type: string` property and optionally any other key/value pairs. e.g., :

```ts
{
  type: "my-event",
  foo: "bar"
}
```

Events can be pushed to the client using `socket.pushEvent`:

```ts
socket.pushEvent({
  type: "my-event",
  foo: "bar",
});
```

:::note Event names are prefixed with `phx:` so an event with the type `my-event` will be sent as `phx:my-event`. :::

### Listening for Events on the Client

Events can be listened for in two ways:

1. Using `window.addEventListener`:

```ts
window.addEventListener("phx:my-event", (event) => {
  console.log(event.detail.foo); // "bar"
});
```

2. Using a client `Hook`:

```ts
this.handleEvent("my-event", (event) => {
  console.log(event.foo); // "bar"
});
```

:::info We haven't discussed Hooks yet but they are not in any way like a React Hook. They are a way to define a
client-side component that can be used in your LiveView. We'll cover them in more detail in a later section.

For now, just know that you can define a client-side component that can listen for events and do something with them.
:::

## URL-based Pushes

The `LiveViewSocket` has two methods for updating the URL of the LiveView:

- `pushPatch` - Updates the LiveView's browser URL with the given path and query parameters.
- `pushRedirect` - Shutdowns the current LiveView and loads another LiveView in its place without reloading the whole
  page (i.e., making a full HTTP request). Can be used to remount the current LiveView if need be.

### `pushPatch` Example

```ts
// Update the URL to /foo?bar=baz
socket.pushPatch("/foo", new URLSearchParams({ bar: "baz" }));
```

`pushPatch` will cause the `handleParams` method to be invoked which can be used to update the LiveView's state based on
the new URL parameters.

### `pushRedirect` Example

```ts
// Shutdown the current LiveView and load a new LiveView at /foo?bar=baz
socket.pushRedirect("/foo", new URLSearchParams({ bar: "baz" }));
```

`pushRedirect` will cause the current LiveView to be shutdown and a new LiveView to be loaded at the given path and
query parameters **without reloading the whole page** (i.e., making a full HTTP request).
