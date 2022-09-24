---
sidebar_position: 2
---

# Live Components

We've mostly been talking about LiveViews, but **LiveViewJS** also supports `LiveComponents`. Live Components are a way
to create self-contained, stateful and stateless components that are reusable across multiple LiveViews. Live Components
are a great way to break up your LiveView into smaller, reusable, more manageable pieces.

## LiveComponent API

LiveComponents have a much simpler API than LiveViews. They have the following methods all of which are optional except
for `render`:

- `mount`
- `update`
- `handleEvent`
- `render` (required)

### Stateful vs Stateless

LiveComponents can be stateful or stateless. Stateful components are identified by passing an `id` property into the
`meta.live_component` function in the LiveView. Stateless LiveComponents do not have an `id` property. Stateful
components are also the only type of LiveComponent that can receive events (and therefore have a `handleEvent` method).

### Lifecycle Differences

Both types of LiveComponents have the same lifecycle methods. Both types initially follow the same execution flow when
they are first loaded:

`mount => update => render`

With Stateless LiveComponents, the execution flow above is the same for every render cycle. For Stateful LiveComponents,
after the first render cycle, the execution flow is:

`update => render`

### Stateful LiveComponent `handleEvent`

Targeting a LiveComponent requires the addition of a `phx-target` attribute to a the rendered HTML element. Inside of a
`render` a LiveComponent can use the `meta.myself` property in the `phx-target` attribute to target itself. For example:

```html
<button phx-click="my_event" phx-target="${meta.myself}">Click Me</button>
```

Alternatively, you can target another LiveComponent by passing the DOM id or class selector into the `phx-target`
attribute. For example:

```html
<button phx-click="my_event" phx-target="#comp_3">Click Me</button>
```

In either case, the `handleEvent` method will be called with the `my_event` event prompting a re-render of the
LiveComponent.

## Adding a LiveComponent to a LiveView

To add a LiveComponent to a LiveView, you use the `LiveViewMeta` `live_component` function. The `live_component`
function takes a LiveComponent along with a JSON object with an optional `id` property. If the `id` property is present,
the LiveComponent will be stateful. If the `id` property is not present, the LiveComponent will be stateless. For
example:

```ts
...
render: (context, meta) => {
  return html`
    <div>
      ${meta.live_component(MyStatefulComponent, {id: "comp_1", bar: "baz"})}
      ${meta.live_component(MyStatefulComponent, {id: "comp_2"})}
      ${meta.live_component(MyStatelessComponent, {foo: "bar"})}
    </div>
  `
}
...
```

## LiveComponentSocket API

Similar to LiveViews, LiveComponents have a `LiveComponentSocket` API that is the utility belt for LiveComponents. Below
is the API for LiveComponentSocket:

```ts
/**
 * Represents the `LiveComponent`'s websocket connectedness along with current
 * state of the component.  Also provides a method for sending messages
 * internally to the parent `LiveView`.
 */
export interface LiveComponentSocket<
  TContext extends LiveContext = AnyLiveContext,
  TInfo extends LiveInfo = AnyLiveInfo
> {
  /**
   * The id of the parent `LiveView`
   */
  id: string;
  /**
   * Whether the websocket is connected (i.e.,  http request or joined via websocket)
   * true if connected to a websocket, false for http request
   */
  connected: boolean;
  /**
   * Read-only, current state of the `LiveComponent`
   */
  context: TContext;
  /**
   * helper method to send messages to the parent `LiveView` via the `handleInfo`
   */
  sendParentInfo(info: Info<TInfo>): void;
  /**
   * `assign` is used to update the `Context` (i.e.,  state) of the `LiveComponent`
   */
  assign(context: Partial<TContext>): void;
  /**
   * helper method to send events to Hooks on the parent `LiveView`
   */
  pushEvent(pushEvent: AnyLivePushEvent): void;
}
```
