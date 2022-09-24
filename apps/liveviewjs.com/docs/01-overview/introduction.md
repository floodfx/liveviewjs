---
sidebar_position: 1
---

# Introduction

LiveViewJS is an open-source framework for "LiveView"-based, full-stack applications in NodeJS and Deno.

The LiveView approach allows developers to build applications with rich user experiences like React, Vue, etc, but **with
far less code and complexity and far more speed and efficiency**.

## What is a LiveView?

A LiveView is a server-rendered HTML page that connects to the server via a persistent web socket. The web socket allows
the client to send user events to the server and the server to send diffs in response. **LiveViewJS** is a LiveView
framework that handles the complex part of this (handling websockets, diffing changes, applying DOM updates, etc.) so that
you can focus on building your application.

Here's the typical "counter" example written as a LiveView in **LiveViewJS**:

```ts
import { createLiveView, html } from "liveviewjs";

/**
 * A basic counter that increments and decrements a number.
 */
export const counterLiveView = createLiveView<
  { count: number }, // Define LiveView Context (a.k.a state)
  { type: "increment" } | { type: "decrement" } // Define LiveView Events
>({
  mount: (socket) => {
    // init state, set count to 0
    socket.assign({ count: 0 });
  },
  handleEvent: (event, socket) => {
    // handle increment and decrement events
    const { count } = socket.context;
    switch (event.type) {
      case "increment":
        socket.assign({ count: count + 1 });
        break;
      case "decrement":
        socket.assign({ count: count - 1 });
        break;
    }
  },
  render: (context) => {
    // render the view based on the state
    const { count } = context;
    return html`
      <div>
        <h1>Count is: ${count}</h1>
        <button phx-click="decrement">-</button>
        <button phx-click="increment">+</button>
      </div>
    `;
  },
});
```

And here is what that LiveView looks like in a browser:
![LiveView Counter Example Screen Recording](/img/screenshots/liveviewjs_counter_liveview_rec.gif)

Yes, it "looks" like a React/Vue/Svelt UI but the main differences are:

- This page was first rendered as plain HTML (not a bundle of JS)
- The client is automatically connected to a server via a websocket
- The click events are automatically shipped to the server
- The server then runs the business logic to update the state
- Using the new state, the server then renders a new view and calculates any diffs
- Those diffs are shipped back to the client, where they are automatically applied

Pretty cool eh? We think so too! While this counter LiveView isn't particularly useful, it gives you a quick intro to how
LiveViews work and what they look like both as code and in the browser. We've got a lot more to show you about
**LiveViewJS** including: built-in real-time / multi-player support, built-in form validation with changesets, built-in
file uploads with image previews and drag and drop support, and more!

But first, a bit more about LiveViews...

## LiveView is already proven technology

[Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html) is already extremely popular in the
Elixir community and has been used to build production applications for years. It powers delightful user experiences and is battle-tested in terms of performance, reliability, and developer productivity.

Here is a quote from the author and inventor of LiveView, [Chris McCord](http://chrismccord.com/) from
["how we got to liveview"](https://fly.io/blog/how-we-got-to-liveview/):

> LiveView strips away layers of abstraction, because it solves both the client and server in a single abstraction. HTTP
> almost entirely falls away. No more REST. No more JSON. No GraphQL APIs, controllers, serializers, or resolvers. You
> just write HTML templates, and a stateful process synchronizes it with the browser, updating it only when needed.

## Advantages

- **Faster way to build rich, full-stack application** - LiveView abstracts away the complexity of client/server
  communication, state management, and synchronization to make it simple and fast to build rich, server-connected user
  experiences. See [LiveView Paradigm](paradigm.md) for more details.
- **Real-time and multi-player built-in** - Broadcasting updates to single or multiple clients is natively supported in
  LiveViewJS. Building features like chat, presence, and real-time dashboards are all supported by LiveView's Pub/Sub.
  We ship with support for Redis (NodeJS) and BroadcastChannels (Deno).
- **Extremely fast "first paint"** - No massive JS bundle downloads, virtual DOM, "hydration", data-fetching, or the
  like. LiveViews are first rendered statically as part of a normal HTTP response. This means "first-paint" is extremely
  fast.
- **Extremely fast user-initiated updates** - LiveView automatically maintains a persistent socket connection between
  client and server. User events are sent to the server and optimized diffs are sent back to the client. All this
  happens extremely fast and transparently to user and developer.
- **No need to build REST or GraphQL APIs** - Full-stack applications usually have front-end and back-end code bases
  adding complexity, effort, and context switching. The LiveView paradigm merges front-end and back-end
  into a single abstraction layer which greatly increases productivity.
- **Robust, battle-tested browser libraries** - **LiveViewJS** uses the exact same browser libraries as Phoenix
  LiveView which has 10s of thousands of production applications serving millions of users. This isn't some new,
  unproven technology.
- **No client/server state synchronization challenges** - State synchronization between client and server is super
  complex for traditional SPAs. LiveViews do not have to worry about the challenges inherent in state synchronization
  because the server is always the source of truth and client updates are pushed to the client.
- **No client-side routing** - No need to use a library like React Router or Vue Router. LiveViews route like multi-page
  applications which is handled automatically by the browser and server. (Another major complication rendered
  unnecessary.)
- **No component libraries (or Storybook) required** - Traditional SPAs require teams to adopt, build or buy and then
  maintain, and customize a component library and use something like [Storybook](https://storybook.js.org/). LiveView
  simplifies this greatly with server-side HTML templates.

## Disadvantages

- **Not a drop-in replacement for traditional SPAs** - LiveView is a new paradigm and is not a drop-in replacement for
  traditional SPA frameworks like React or Vue. It is a new way of building full-stack applications.
- **Not a great solution for pure static sites** - Static sites that do not have user events or don't update often are
  not a great fit for LiveView.

## How is this different than Phoenix LiveView?

The Phoenix project's backend is written in Elixir and runs on the ErlangVM. **LiveViewJS** is a protocol compliant,
implementation of Phoenix LiveView but written in Typescript and runs on NodeJS and Deno. **We want to bring the magic
and productivity of LiveView to the NodeJS and Deno ecosystems** and are obviously huge fans of Phoenix LiveView and the
team that invented it. We believe in it so much that we think more developers should have access to the programming
paradigm it enables.

### Reach more developers

Unfortunately, Elixir only represents
[about 2%](https://survey.stackoverflow.co/2022/#section-most-popular-technologies-programming-scripting-and-markup-languages)
of the programming language market share. We believe that **LiveViewJS** will help bring the productivity and magic of
LiveView to the
[65% of developers](https://survey.stackoverflow.co/2022/#section-most-popular-technologies-programming-scripting-and-markup-languages)
that use Javascript (and Typescript).
