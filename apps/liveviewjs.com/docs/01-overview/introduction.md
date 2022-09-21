---
sidebar_position: 1
---

# Introduction
LiveViewJS is an open-source framework for "LiveView"-based, full-stack applications in NodeJS and Deno.

The LiveView approach allows developers to build applications with rich user experiences like React, Vue, etc but **with far less code and complexity, and far more speed and efficiency**.

## What is a LiveView?
A LiveView is a server-rendered HTML page that connects to the server via a persistent web socket.  The web socket allows the client to send user events to the server and the server to send diffs in response. **LiveViewJS** is a LiveView framework that handles the complex part of this (handling websockets, diffing changes, appling DOM updates, etc) so that you can focus on building your application.

We'll obviously show you lots of examples and get into the details of how LiveViews and **LiveViewJS** works as you go through the documentation. 

## LiveView is already proven technology
[Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html) is already extremely popular in the Elixir community and has been used to build production applications for years.  It powers delightful user experiences and is battle-tested both in terms of performance and reliability and in terms of developer productivity.

Here is a quote from the author and inventor of LiveView, [Chris McCord](http://chrismccord.com/) from ["how we got to liveview"](https://fly.io/blog/how-we-got-to-liveview/):
> LiveView strips away layers of abstraction, because it solves both the client and server in a single abstraction. HTTP almost entirely falls away. No more REST. No more JSON. No GraphQL APIs, controllers, serializers, or resolvers. You just write HTML templates, and a stateful process synchronizes it with the browser, updating it only when needed.

## Advantages
* **Faster way to build rich, full-stack application** - LiveView abstracts away the complexity of client/server communication, state management, and synchronization to make it simple and fast to build rich, server-connected user experiences. See [LiveView Paradigm](paradigm.md) for more details.
* **Real-time and multi-player built-in** - Broadcasting updates to single or multiple clients is natively supported in LiveViewJS. Building features like chat, presence, and real-time dashboards are all supported by LiveView's Pub/Sub. We ship with support for Redis (NodeJS) and BroadcastChannels (Deno).
* **Extremely fast "first paint"** - No massive JS bundle downloads, virtual DOM, "hydration", data-fetching, or the like. LiveViews are first rendered statically as part of a normal HTTP response. This means "first-paint" is extremely fast. 
* **Extremely fast user-initiated updates** - LiveView automatically maintains a persistent socket connection between client and server. User events are sent to the server and optimized diffs are sent back to the client. All this happens extremely fast and transparently to user and developer.
* **No need to build REST or GraphQL APIs** - Full-stack applications usually have front-end and back-end code bases which adds a ton of complexity, effort, and context switching. The LiveView paradigm merges front-end and back-end into a single abstraction layer which greatly increases productivity.  
* **Roubust, battle-tested browser libraries** - **LiveViewJS** uses the exact same browser libraries as Phoenix LiveView which has 10s of thousands of production applications serving millions of users. This isn't some new, unproven technology. 
* **No client/server state synchronization challenges** - State syncrhonization between client and server is super complex for traditional SPAs. LiveViews do not have to worry about the challenges inherent in state synchronization because the server is always the source of truth and client updates are pushed to the client.
* **No client-side routing** - No need to use a library like React Router or Vue Router. LiveViews route like multi-page applications which is handled automatically by the browser and server. (Another major complication rendered unnecessary.)
* **No component libraries (or Storybook) required** - Traditional SPAs require teams to adopt, build or buy and then maintain, and customize a component library and use something like [Storybook](https://storybook.js.org/). LiveView simplifies this greatly with server-side HTML templates.

## Disadvantages
* **Not a drop-in replacement for traditional SPAs** - LiveView is a new paradigm and is not a drop-in replacement for traditional SPA frameworks like React or Vue. It is a new way of building full-stack applications.
* **Not a great solution for pure static sites** - Static sites that do not have user events or don't update often are not a great fit for LiveView. 

## How is this different than Phoenix LiveView?
The Phoenix project's backend is written in Elixir and runs on the ErlangVM.  **LiveViewJS** is a protocol compliant, implementation of Phoenix LiveView but written in Typescript and runs on NodeJS and Deno.  **We want to bring the magic and productivity of LiveView to the NodeJS and Deno ecosystems** and are obviously huge fans of Phoenix LIveView and the team that invented it.  We believe in it so much that we think more developers should have access to the programming paradigm it enables.  

### Reach more developers
Unfortuately, Elixir only represents [about 2%](https://survey.stackoverflow.co/2022/#section-most-popular-technologies-programming-scripting-and-markup-languages) of the programming language market share.  We believe that **LiveViewJS** will help bring the productivity and magic of LiveView to the [65% of developers](https://survey.stackoverflow.co/2022/#section-most-popular-technologies-programming-scripting-and-markup-languages) that use Javascript (and Typescript). 
