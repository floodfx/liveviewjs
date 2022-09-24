---
sidebar_position: 6
---

# LiveView API - `handleInfo`

`handleInfo` is how server-side events (a.k.a `Info`) are handled. These server-side events are initiated by processes
that are happening on the server for example: database updates, background jobs, pub/sub messages, or some other
asynchronous process. Just like `handleEvent` and `handleParams`, `handleInfo` is automatically passed the `info` event
(i.e. server event) along with the `socket` and can use it to manipulate the `context` of the LiveView or otherwise
respond to the `info` messages it receives.

## `handleInfo` Signature

```ts
handleInfo(info: TInfos, socket: LiveViewSocket<TContext, TInfos>): void | Promise<void>;
```

## `handleInfo` Use Cases

There are three main use cases for `handleInfo`:

- Handling an asynchronous process initiated from a user event without blocking the UI
- Handling an asynchronous process initiated from a background process
- Handling a pub/sub message
