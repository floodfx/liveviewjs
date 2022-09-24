---
sidebar_position: 5
---

# LiveView API - `handleParams`

Let's explore the `handleParams` method. Since the previous example (`counterLiveView`) did not use `handleParams`,
we'll define `helloLiveView.ts` and explore the `handleParams` method with it. As you can see below, `helloLiveView.ts`
defines `mount`, `handleParams`, and `render`.

```ts title="helloLiveView.ts"
export const helloLiveView = createLiveView({
  mount: (socket) => {
    socket.assign({ name: "World" });
  },
  handleParams(url, socket) {
    const name = url.searchParams.get("name") || "World";
    socket.assign({ name });
  },
  render: (context) => html`Hello ${context.name}!`,
});
```

In the case of `helloLiveView`, we are using `handleParams` to update the `name` in the `context` based on the `name`
query parameter in the `URL`. If there is no `name` query parameter, we default to `World`.

## Example Renders

Let's say you have the `helloLiveView` routed to `/hello`. Visiting the following paths would result in the following
renders:

- `/hello` - `Hello World!`
- `/hello?name=LiveViewJS` - `Hello LiveViewJS!`
- `/hello?name=LiveViewJS&foo=bar` - `Hello LiveViewJS!`
- `/hello?name=LiveViewJS#blah` - `Hello LiveViewJS!`

## `handleParams` Method

`handleParams` is automatically called by **LiveViewJS** on the initial load of a LiveView, as well as anytime the URL of
the LiveView changes. `handleParams` allows developers to access the full `URL` of the LiveView including the `host`,
`path`, `hash`, `pathname`, etc, and then update the `context` of the `socket` or otherwise respond to data in the `URL`.

:::note Worth noting that the http server (e.g. express or oak) handles the routing of the browser to this LiveView. This
means that changes in the `URL` for `handleParams` are typically search parameters or hash changes. Changing the host
and/or path of a URL will typically mean the server routes you to a different LiveView (if one exists at that host and
path). :::

## `handleParams` Signature

```ts
handleParams(url: URL, socket: LiveViewSocket<TContext, TInfos>): void | Promise<void>;
```

:::info The `URL` passed to the `handleParams` method is the standard `URL` object, not a **LiveViewJS** specific `URL`
object. See the [MDN URL documentation](https://developer.mozilla.org/en-US/docs/Web/API/URL) for more information. :::
