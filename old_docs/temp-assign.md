## Temporary Assign

A feature of `LiveView` development is that data stored on the socket (via `socket.assign`) is stored in memory and made available on subsequent user events.  In other words, `LiveView` state is kept in the socket.  This makes sense for small pieces of data that change frequently (like a counter, or form input) but for other types of data, generally large, infrequently updated data, storing that data in memory is just a waste of resources.

To solve this problem, LiveViewJS provides a `tempAssign` function that allows you to mark parts of the `Context` as temporary and define what value to reset the property to after each `render`.  temporarily store data in the socket.

Let's say you have a list of employees for a company that you query from the DB in your `mount` function.  Likely, most of this data will not change.  You can use `assign` to put this data into the socket and then use `tempAssign` to define what value to reset the property to after each `render`.

```ts
mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<MyContext>) {
    socket.assign({
      // assign the list of employees to the socket
      employees: listEmployees()
    });

    // reset employees to empty array after each render
    socket.tempAssign({ employees: [] });
  }
```

For your reference: [Phoenix's Temporary Assigns docs](https://hexdocs.pm/phoenix_live_view/dom-patching.html#temporary-assigns).