---
sidebar_position: 2
---

# LiveView Paradigm

The LiveView model is simple. The server renders an HTML page when a user makes the initial HTTP request. That page
then connects to the server via a persistent web socket. From there, user-initiated events (clicks, form input, key
events, focus/blur events, etc) are sent over the web socket to the server in very small packets. When the server
receives the events, it runs the business logic for that LiveView, calculates the new rendered HTML, and then sends only
the diffs to the client. The client automatically updates the page with the diffs. The server can also send diffs back
to the client based on events on the server or received from other clients (think chat, or other pub/sub scenarios).

:::info **LiveViewJS** solves the complex parts of LiveViews such as connecting and managing web sockets, diffing and
patching the UI, routing events, real-time/multiplayer, file uploads, and more. :::

## How is this different from SPAs?

SPA-frameworks (React, Vue, Svelt, etc) only manage state and rendering on the client. You need a completely different
backend to handle business logic and persistence, typically a REST or GRAPHQL API (and related auth). This means you
need to write two code bases, one for the front-end and one for the back-end and then integrate them. **LiveViewJS** is
a single code base that handles both the front-end and back-end while enabling the same rich user experiences that a
SPA enables. With **LiveViewJS** you write your business logic and persistence code in the same place as your front-end
code. This greatly simplifies the development process, reduces the number of moving parts, and increases development velocity.

It's worth re-reading Chris McCord's quote in [the Introduction](introduction), or even better, read these docs and run the
examples! 😀 You'll see how easy it is to build rich, interactive, and responsive user experiences with **LiveViewJS**
and start to understand how much of an improvement and paradigm shift it is.
