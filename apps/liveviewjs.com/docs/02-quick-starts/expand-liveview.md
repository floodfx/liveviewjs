---
sidebar_position: 3
---

# Expand the LiveView

We already have a basic "counter" LiveView that we can use to increment and decrement a counter.  Let's expand the LiveView to add a few more features:
- initial count value based on URL
- timer that tells us how long the LiveView has been open

## URL Params

What if we want to be able to set the initial count value based on the URL?  For example, if we navigate to `/counter?count=10` we want the counter to start at 10.  Alternatively, we might want a URL path paramter (e.g. `/counter/10`) to set the initial value.  We will show you how to do both.

### URL Path Params

First, let's initialize the count value based on a URL path parameter.  To implement this, we'll need to do two things:
1. Update the LiveView router to accept a path parameter
2. Update the LiveView to use the path parameter in `mount`

#### 1. Update the LiveView Router
Let's update the router to accept a path parameter.  We'll do this by adding a `count` property to the route definition:

```ts title="src/server/liveview/router.ts" {3}
export const liveRouter: LiveViewRouter = {
  "/counter": CounterLive,
  "/counter/:count": CounterLive,
  ...
};
```
Here we've added a `:count` path parameter to the `/counter` route.  When a request is made to this path, the `count` parameter will be available in the `params` object in the `mount` lifecycle method.

#### 2. Update the LiveView to use the path parameter in `mount`
Now that we've updated the router to accept a path parameter, we need to update the LiveView to use the path parameter.  We'll do this by updating the `mount` method to use the `count` parameter:

```ts title="src/server/liveview/counter.ts" {2-5}
  ...
  // expand the mount method to accept a path parameter
  mount: (socket, _, params) => {
    // check if params.count is defined and if so use it for the initial count
    const count = params.count ? +params.count : 0;
    socket.assign({ count });
  },
  ...
```

Now if we navigate to `/counter/10` we should see the counter start at 10.

### URL Query Params
Alternatively, we might want to use a URL query parameter to set the initial count value.  To do this, we'll need add a new lifecycle method to the LiveView: `handleParams`.  During the initial page load, the `handleParams` method is called immediately after the `mount` method.  (It is called at other times as well - more details in the [LiveView Lifecycle](/docs/liveview-lifecycle) section.)

```bash
npx --yes @liveviewjs/gen@latest --generator liveview
```

You will be prompted to provide the following:

- `name` - the name of the LiveView.  This will be used to name the LiveView class and the file that contains the LiveView code. Use `CounterLive` for now.
- `route` - the route that will be used to access the LiveView.  This will be used to add the route to the project's LiveView router. Use `/counter` for now.
- `template` - the template that will be used to render the LiveView: `min` or `max` - choose `min` for now.
- `runtime` - the runtime of the project: `node` or `deno` (should be the same runtime as your project)

:::note

You can also provide these options on the command line.  For example, to generate a LiveView named `CounterLive` with a route of `/counter` and a template of `min` and a runtime of `node` you could run the following command:

```bash
npx --yes @liveviewjs/gen@latest --generator liveview --name CounterLive --route "/counter" --template min --runtime node
```
:::

## Navigate to the Generated LiveView
Once you've generated the new LiveView, you should be able to navigate to the route you specified in your browser and see the LiveView:

- Node - [http://localhost:4001/counter](http://localhost:4001/counter)
- Deno - [http://localhost:9001/counter](http://localhost:9001/counter)

## Update the LiveView
By default, the `min` LiveView will have a `render` method that returns very basic HTML.  Let's update the LiveView to render a simple counter.

### Initialize the state
The first thing we need to do is initialize the state of the LiveView.  We'll do this in the `mount` lifecycle hook.  The `mount` hook is called when the LiveView is first loaded.  

Add the `mount` method to the `CounterLive` LiveView:

```ts title="src/server/liveview/counter.ts" {2-5}
export const CounterLive = createLiveView({
  mount: (socket) => {
    // init state, set count to 0
    socket.assign({ count: 0 });
  },
  // rest of the LiveView
  ...
});
```

This sets the initial state of the LiveView to `{ count: 0 }`. This state will now be set for other LiveView lifecycle methods including the `render` method.

### Display the state
Now that we have the state initialized, let's display it in the LiveView.  We'll do this in the `render` lifecycle method:

```ts title="src/server/liveview/counter.ts" {6,9}
export const CounterLive = createLiveView({
  // rest of the LiveView
  ...
  render: (context) => {
    // render the view based on the state
    const { count } = context;
    return html`
      <div class="flex flex-col items-center mt-4">
        <h1 class="text-2xl">Count is: ${count}</h1>
      </div>
    `;
  },
});
```

The code above extracts the `count` value from the context (i.e. state) and inserts it into the LiveView's HTML.

### Reload the LiveView
Go ahead and refresh the page in your browser.  You should see the count displayed in the LiveView (which will be 0 since we initialized the state to 0).

### React to client events
Showing a static state isn't particularly useful.  Let's next add some buttons to the LiveView that will allow the user to increment and decrement the count.  

First let's add some buttons to the `render` method:

```ts title="src/server/liveview/counter.ts" {11-12}
export const CounterLive = createLiveView({
  // rest of the LiveView
  ...
  render: async (context) => {
    // render the view based on the state
    const { count } = context;
    return html`
      <div class="flex flex-col items-center mt-4">
        <h1 class="text-2xl">Count is: ${count}</h1>
        <div class="flex space-x-4">
          <button phx-click="decrement" class="rounded-md px-4 py-2 bg-blue-400">-</button>
          <button phx-click="increment" class="rounded-md px-4 py-2 bg-blue-400">+</button>
        </div>
      </div>
    `;
  },
});
```

Above we have added two buttons to the LiveView.  These buttons have the `phx-click` attribute defined which binds the `decrement` and `increment` events to the button click event.  That means, when the user clicks on the buttons, the **LiveViewJS** will automatically send a `decrement` or `increment` event from the client to the server running the LiveView.

We'll cover different `phx-` bindings in the section on [user bindings](/docs/category/user-events).  For now, it's enough to know that when a user clicks on an element with a `phx-click` attribute **LiveViewJS** automatically sends the value of the attribute as an event to the LiveView.

### Handle Events
If you reload the page and click on the buttons, nothing happens.  This is because we are not handling events.  Let's update the LiveView to handle the `decrement` and `increment` events.

To do this, we'll add a `handleEvent` method to the LiveView.  The `handleEvent` method is called when the LiveView receives an event from the client.

```ts title="src/server/liveview/counter.ts" {4-15}
export const CounterLive = createLiveView({
  // rest of the LiveView
  ...
  handleEvent: async (event, socket) => {
    // handle events
    const { count } = context;
    switch (event.type) {
      case "decrement":
        socket.assign({ count: count - 1 });
        break;
      case "increment":
        socket.assign({ count: count + 1 });
        break;
    }
  },
});
```

The code above extracts the `count` value from the socket context and then assigns a new state based on the event type.  If the event type is `decrement`, the `count` value is decremented by 1.  If the event type is `increment`, the `count` value is incremented by 1.

### Success!
Go ahead and reload the page in your browser.  You should now be able to increment and decrement the count when you click on the buttons.

**Horray!**  You've just created a basic LiveView that has state, updates the state based on client events, and renders the state to the client.

:::note

Remember, unlike an SPA framework, **LiveViewJS** is a client/server architecture.  The LiveView logic is running on the server which reacts to events automatically shipped from the client.  The server updates the state based on events and sends down the diff to the client which applies it automatically all without a page refresh.

:::

## Recap
We implemented a basic "counter" LiveView by defining a coupe of lifecycle methods:
- `mount` - set the initial state of the LiveView
- `handleEvent` - update the state of the LiveView based on client events
- `render` - render the LiveView based on the state and bind client events to the rendered HTML

## Next
Just from this section, you've been exposed to half of the lifecycle methods for a LiveView.  In the next section, we'll add some more functionality that shows you the other half of the lifecycle methods namely:
- `handleParams` - update the state of the LiveView based on URL params
- `handleInfo` - update the state of the LiveView based on server / async events
- `shutdown` - clean up any resources when the LiveView is shutdown


