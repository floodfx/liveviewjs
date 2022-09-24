---
sidebar_position: 1
---

# Overview

LiveViewJS natively supports real-time, multi-player user experiences. This is because **LiveViewJS** (and Phoenix
LiveView for that matter) are built on top of Pub/Sub primatives.

Pub/Sub is a common pattern for decoupling processes by allowing messages to be sent to a topic by one process and
received asynchronously by another. In LiveViewJS, pub/sub is used to enable real-time, multi-player web application.

## Pub/Sub in LiveViewJS

There are two main ways to enable real-time, multi-player experiences in LiveViewJS:

- **subscribe to topics** - If you have a LiveView that needs to receive messages from a topic, you can subscribe to the
  topic in the `mount` method and receive "Info" messages in the `handleInfo` method.
- **broadcast to topics** - If you have a LiveView (or data model) that needs to send messages to a topic, you can
  broadcast to the topic using an implementation of the `PubSub` interface.

:::info **LiveViewJS** ships with three implementations of the `PubSub` interface:

- `SingleProcessPubSub` - A pub/sub implementation (backed by `EventEmitter` that is useful for testing and development
  (as it only works in a single process).
- `RedisPubSub` - A pub/sub implementation that uses Redis as the pub/sub backend. This is useful for production
  deployments that are running on NodeJS
- `BroadcastChannelPubSub` - A pub/sub implementation that uses the `BroadcastChannel` API which is a server enabled
  pub/sub implementation that is useful for production deployments on Deno Deploy. :::

## Subscribe to Topics

If you have a LiveView that needs to receive messages from a topic, you can subscribe to the topic in the `mount` method
and receive "Info" messages in the `handleInfo` method.

For example:

```ts
...
mount: (socket) => {
  // subscribe to Info events on the "my_topic" topic
  socket.subscribe("my_topic");
},
...
```

This will cause the `handleInfo` method to be called with any messages that are broadcast to the "my_topic" topic.

```ts
...
handleInfo: (info, socket) => {
  // handle info messages
  switch (info.type) {
    ...
    case "my_topic":
      // handle my_topic messages
      break;
    ...
  }
},
...
```

## Broadcast to Topics

If you have a LiveView (or data model) that needs to send messages to a topic, you can broadcast to the topic using an
implementation of the `PubSub` interface.

For example:

```ts
...
// create a pubsub instance
const pubSub = new SingleProcessPubSub();
...
// broadcast a message to the "my_topic" topic
pubSub.publish("my_topic", { message: "Hello World" });
...
```

This will cause the `handleInfo` method to be called with any messages that are broadcast to the "my_topic" topic.

## Connecting with other LiveViews

It should be clear at this point that if you want to connect LiveView with a different LiveView (either the same type or
a different type) all you need to do is broadcast a message to a topic that the other LiveView is subscribed to.

## Connecting with External Events

Let's say you have an event that is happening outside of the LiveViewJS. All you have to do is connect that event with
the **LiveViewJS** by broadcasting a message to a topic that the **LiveViewJS** is subscribed to. This means you either
need to use the `PubSub` implementation (with the same configuration) in that different code or you need to use the same
pub/sub backend (e.g.,  Redis or BroadcastChannel).
