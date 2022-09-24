---
sidebar_position: 7
---

# User-Initiated Event with `handleInfo`

Search is a common use case where a user-initiated event might be handled by `handleInfo`.

## Example Search LiveView

```ts title="searchLiveView.ts"
import { createLiveView, html } from "liveviewjs";
import {searchUsers} from "../services/searchUsers";
/**
 * A basic search that searches for a user by name.
 */
export const searchLiveView = createLiveView<
  // Define LiveView Context / State
  { search: string; results: string[], loading: boolean },
  // Define LiveView Events
  { type: "search"; search: string }
  // Define LiveView Infos
  { type: "doSearch"; search: string }
>({
  // Setup / initialize the LiveView Context (i.e.,  set search to "" and results to [])
  mount: (socket) => {
    socket.assign({ search: "", results: [] });
  },
  // Handle incoming search events from User input
  handleEvent: (event, socket) => {
    const { search } = socket.context;
    switch (event.type) {
      case "search":
        // set the search data and loading in the context
        socket.assign({ search: event.search, loading: true });
        // Send a doSearch info (event) to the `handleInfo` method
        socket.sendInfo({ type: "doSearch", search: event.search });
        break;
    }
  },
  // Handle incoming info events from the server
  handleInfo: (info, socket) => {
    const { search } = socket.context;
    switch (info.type) {
      case "doSearch":
        // Search for users and update the results in the context
        const results = await searchUsers(info.search);
        socket.assign({ results, loading: false });
        break;
    }
  },
  // Renders the Search View based on the current Context / State
  render: (context) => {
    const { search, results } = context;
    return html`
      <div>
        <h1>Search for a user</h1>
        <input
          type="text"
          placeholder="Search for a user"
          value=${search}
          phx-change="search"
        />
        ${renderResults(results, loading)}
      </div>
    `;
  },
});

function renderResults(results: string[], loading: boolean) {
  if (loading) {
    return html`<div>Loading...</div>`;
  }
  if (results.length === 0) {
    return html`<div>No results</div>`;
  }
  return html`
    <ul>
      ${results.map((result) => html`<li>${result}</li>`)}
    </ul>
  `;
}
```

## How it works

- The LiveView renders a form that allows a user to search for a user by name. When the user submits the form, the
  `handleEvent` method is called with the `search` event.
- The `handleEvent` method then updates the `context` with the search text, sets `loading` to `true`, and sends a
  `doSearch` info event to the `handleInfo` method.
- The `handleInfo` method then performs the search asynchronously (i.e.,  _it doesn't block rendering from the
  `handleEvent`_).
- When the search is completed `handleInfo` and updates the results in the context and sets `loading` to `false`.
  Updating the context causes the `render` method to be called again, which renders the search results.

## `handleInfo` Use Cases

There are three main use cases for `handleInfo`:

- Handling an asynchronous process initiated from a user event without blocking the UI
- Handling an asynchronous process initiated from a background process
- Handling a pub/sub message
