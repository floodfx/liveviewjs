---
sidebar_position: 4
---

# LiveViewSocket API - Server Events

Server events are important to connect LiveViews with asynchronous processes. For example, a LiveView may need to wait
for a long database query or search service to complete before rendering the results. Or a LiveView may want to send
updates based on a webhook or action from another user.

## LiveViewSocket Properties and Methods

There are two LiveViewSocket API methods that help facilitate server events: | Name | Description | |---|---| |
`sendInfo(info: Info<TInfos>): void;` | Send an internal event (a.k.a "Info") to the LiveView's `handleInfo` method | |
`subscribe(topic: string): Promise<void>;` | Subscribe to the given topic using pub/sub. Events published to this topic
will be delivered to `handleInfo`. |

## `sendInfo` Method

`socket.sendInfo` enables a `LiveView` to send message to itself which is useful for executing actions that are
asynchronous. Messages sent via `socket.sendInfo` are received by the `handleInfo` method after the current render
lifecycle has completed. (In other words, `handleInfo` is called after the `render` call which will result in another
`render` after `handleInfo` completes.)

When creating your `LiveView` you can provide the typing for `TInfo` which describes the "shape" of the possible info
messages. e.g.

```ts
// Define the MyContext, MyEvents, and MyInfo types
type MyContext = {query: string, loading: boolean, results: string[]};
type MyEvents = {type: "search", query: string};
type MyInfo = {type: "run_search", query: string} | {type: "refresh"};

// Annotate the createLiveView function with the types
const myLiveView = createLiveView<MyContext, MyEvents, MyInfo>(
  handleEvent: (event, socket) => {
    ...
    if(event.type === "search" ) {
      // update the context with loading status and empty results so
      // that UI will be updated for user
      socket.assign({ loading: true, results: [], query: event.query });
      // send internal message to run the search process
      socket.sendInfo({ type: "run_search", query: event.query })
    }
  }
  ...
  handleInfo: (info, socket) => {
    if(info.type === "run_search") {
      const { query } = info;
      // run the search
      const results = searchService.run(query)
      // update the context with results which will update the UI
      socket.assign({ loading: false, results })
    }
    ...
  }
  ...
)
```

`socket.sendInfo` can take a type as a string for cases where there isn't additional information passed along with
the message.

```ts
// or send just the "type" as a string
socket.sendInfo("refresh");
```

## `subscribe` Method

`socket.subscribe` enables a `LiveView` to subscribe to a topic using pub/sub. Events published to this topic will be
delivered to `handleInfo`. This is useful for cases where a LiveView needs to receive updates from another process or
user.

You can provide the type annotation for messages you expect to receive from a pub/sub topic as well.
