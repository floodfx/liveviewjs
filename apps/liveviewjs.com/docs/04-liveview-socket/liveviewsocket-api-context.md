---
sidebar_position: 2
---

# LiveViewSocket API - Context

The "context" of a LiveView is the current state of the LiveView. One way to think of a LiveView is as a set of methods
that handle events, read and write the context, and render a view based on the data in the context. Obviously,
properties and methods that manipulate the context are very important to a LiveView.

## Context Properties and Methods on the `LiveViewSocket`

Three parts of the `LiveViewSocket` are used to manipulate the context:

| Name                                          | Description                                                                                                                                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context` (property, read-only)               | The current context (i.e.,  state) of the LiveView                                                                                                                                               |
| `assign(context:Partial<TContext>):void;`     | Update the context (i.e.,  state) of the LiveView                                                                                                                                                |
| `tempAssign(context:Partial<TContext>):void;` | Marks any set properties as temporary and will be reset to the given value after the next render cycle. Typically used to ensure large but infrequently updated values are not kept in memory. |

## Details

`socket.assign` and `socket.context` are the work-horse methods for manipulating and reading the state of the LiveView.
The `assign` method is used to update the state of the LiveView and the `context` property is used to read the state of
the LiveView.

```ts
// Update the context (i.e.,  current state) of the `LiveView`
socket.assign({ foo: "bar" });
```

```ts
// Read the context (i.e.,  current state) of the `LiveView`
if (socket.context.foo === "baz") {
  // do something
}
// or destructure data from the context
const { foo } = socket.context;
```

## Context Type Annotations

When creating a `LiveView`, developers can provide a type annotation for `TContext` which describes the "shape" of the
context for that LiveView. This is useful for providing type safety and autocomplete for the context (in Typescript).

```ts

// You can define the "shape" of the TContext by annotating the createLiveView function
const myLiveView = createLiveView<{foo: string}>(
  mount: (socket) => {
    socket.assign({ foo: "bar" });
    ...
    socket.assign({ baz: "qux" }); // type error no "baz" property in context
  }
  ...
)
```

You can type the Context inline as above or you can define the context type first and then use it as a type
annotation:

```ts
// Define the MyContext interface
interface MyContext { foo: string };
// Annotate the createLiveView function with the MyContext interface
const myLiveView = createLiveView<MyContext>(...)
```

## Context Persisted for the Life of the LiveView

The `context` of a LiveView is persisted on the server (in memory by default) which means any data added to the
`context` (via `assign`) will be stored until that LiveView instance is cleaned up.

## Temporary Data for Context

Sometimes you want to add data to a `context` that is temporary &mdash; that is, only added to the context for one
"render cycle". There is a method called `socket.tempAssign` that allows a developer to tell **LiveViewJS** to set a
`context` property to a given value after the render cycle. Typically this is used for large objects or collections that
don't change often and therefore probably don't need to be stored in memory (e.g., collection of users or messages,
etc).

```ts
// first assign a large object to the context
socket.assign({ photos: [
  ...// 10s, 100s, 1000s, of photos
]});
// use tempAssign to tell LiveViewJS to clear the photos array after this render cycle
socket.tempAssign({ photos: [] });
```
