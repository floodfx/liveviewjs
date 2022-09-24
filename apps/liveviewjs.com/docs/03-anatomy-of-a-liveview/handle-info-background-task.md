---
sidebar_position: 8
---

# Background Task with `handleInfo`

A "live" dashboard that updates with the latest metrics periodically is another use case that shines with server events
handled asynchronously by `handleInfo`.

## Example Live Dashboard LiveView

```ts title="dashboardLiveView.ts"
/**
 * A dashboard that automatically refreshes every second
 */
export const dashboardLiveView = createLiveView<
  // Define LiveView Context / State
  { newOrders: number; salesAmount: number; rating: number },
  // Define LiveView External Events
  {} // No external events
  // Define LiveView Internal Events
  { type: "tick" }
>({
  mount: (socket) => {
    if (socket.connected) {
      // only start repeating if the socket is connected (i.e.,  websocket is connected)
      socket.repeat(() => {
        // send the tick event to `handleInfo` every second
        socket.sendInfo({ type: "tick" });
      }, 1000);
    }
    socket.assign(nextRandomData());
  },
  // on tick, update data
  handleInfo: (_, socket) => socket.assign(fetchLatestData()),
  // render the dashboard
  render: (context) => {
    const { newOrders, salesAmount, rating } = context;
    return html`
      <h1>Sales Dashboard</h1>
      <hr />
      <span>🥡 New Orders</span>
      <h2>${newOrders}</h2>
      <hr />
      <span>💰 Sales Amount</span>
      <h2>${salesAmount}</h2>
      <hr />
      <span>🌟 Rating</spa>
      <h2>${rating}</h2>
    `;
  },
});
```

:::note The `fetchLatestData` method is not shown here because the implementation is not important. Just assume it
return the latest order, sales, and review data from a database, feed, API, etc. :::

## How it works

- The LiveView renders a dashboard that refreshes every second with the latest order, sales, and review data.
- `mount` kicks off the `repeat` function that sends a `tick` event to `handleInfo` every second.
- The `handleInfo` method then fetches the data asynchronously and updates the context with the latest data.
- When the latest data is successfully fetched, the `context` is updated, which causes the `render` method to be called
  again, pushing the latest data to the client.

## `handleInfo` Use Cases

There are three main use cases for `handleInfo`:

- Handling an asynchronous process initiated from a user event without blocking the UI
- Handling an asynchronous process initiated from a background process
- Handling a pub/sub message
