---
to: README.md
---
# <%= h.inflection.camelize(name, false) %>

## About
This is my awesome LiveViewJS project. There are many like it but this one is mine.

## Features
* Live, dynamic user experiences without complex front-end code
* Easy, automatic state management between server and client
* Simple, powerful form validation using changesets
* Batteries included file upload support with DnD, progress, and image previews
* Real-time, multiplayer capabilities with PubSub

## Routes
* / - Index redirects to /hello
* /hello - simple hello world LiveView
* /hello/:name - simple hello world LiveView with dynamic name

## Running Locally

### Load the Client-side JS dependencies
The project uses ESBuild to bundle the client-side JS dependencies. This is done automatically when you start the server *but* it needs the dependencies to be installed into /node_modules.
`npm install`

### Start the Deno Server
This will start, compile (both client and server), and run the server.  It will also watch for changes and recompile/restart the server.
`deno run --allow-run --allow-read --allow-write --allow-net --allow-env  src/server/autorun.ts`

## More documentation
Visit [LiveViewJS](https://liveviewjs.com) for more documentation, examples, and guides.
