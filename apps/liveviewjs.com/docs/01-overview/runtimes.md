---
sidebar_position: 3
---

# Packages & Runtimes

LiveViewJS is written in Typescript and runs on both [NodeJS](https://nodejs.org/en/) and [Deno](https://deno.land/).
We've abstracted away APIs specific to each runtime so that you can write your code once and run it on both
runtimes, assuming you don't use any runtime-specific APIs. That said, most developers are targeting one or the other, and
we've made it easy to use **LiveViewJS** with either runtime.

## NodeJS and Deno Differences

As mentioned, we've worked hard to abstract away the differences between NodeJS and Deno so that you can write your code
once and run it on both runtimes. The only major difference between the two is with the following:

- Pub/Sub - NodeJS has a Redis implementation for multi-process pub/sub while Deno uses
  [BroadcastChannel](https://deno.com/deploy/docs/runtime-broadcast-channel) for multi-process pub/sub. Out of the box,
  both NodeJS and Deno use the same single process EventEmitter-based implementation.
- HTTP Server Libraries - With NodeJS, we ship with support for [Express](https://expressjs.com/). Deno's HTTP server
  framework is called [Oak](https://deno.land/x/oak@v11.1.0), and we ship with support for that. Theoretically, any HTTP
  server framework that supports websockets should work with LiveViewJS. We've only tested with Express and Oak, but we'd
  love to hear about your experiences with other frameworks and help support your framework of choice.

## Other Webservers?

We've built out support for Express and Oak, but theoretically, any javascript HTTP webserver with support for websockets
should work with LiveViewJS. See [webserver integration](/docs/webserver-integration/support-webserver-x) for more
details on integrating with your webserver of choice.

## What about Bun?

LiveViewJS also runs on [Bun](https://bun.sh/). We basically ran the NodeJS (express) version on Bun, and it works great!
[Let us know](https://github.com/floodfx/liveviewjs/issues) if you run into any issues running **LiveViewJS** on Bun.

## LiveViewJS Packages

LiveViewJS is broken up into the following packages:

- `liveviewjs` [Node](https://www.npmjs.com/package/liveviewjs) and [Deno](https://deno.land/x/liveviewjs) - The core
  package that contains the **LiveViewJS** core server code. This package is runtime agnostic and can be used with
  either NodeJS or Deno.
- `@liveviewjs/gen` [Link](https://www.npmjs.com/package/@liveviewjs/gen) - The code generator package that is used to
  generate the LiveViewJS code including minimal project configuration for both NodeJS and Deno. This package will also add support for generating LiveViews and LiveComponents as well as other boilerplate code.
- `@liveviewjs/express` [Node](https://www.npmjs.com/package/@liveviewjs/express) - The Express package contains [ExpressJS](https://expressjs.com/) integration code and NodeJS-specific utilities like Redis pub/sub. This package is used to integrate **LiveViewJS** with Express (NodeJS). To user this packages install via `npm install @liveviewjs/express` or `yarn add @liveviewjs/express`.
- `deno` [Link](https://github.com/floodfx/liveviewjs/tree/main/packages/deno) - The Deno package contains [Oak](https://deno.land/x/oak) integration code and Deno-specific LiveViewJS utilities like BroadcastChannel pub/sub. This package is used to integrate **LiveViewJS** with Oak (Deno).  To use this package, import into your Deno project via `import { LiveViewJS } from "https://raw.githubusercontent.com/floodfx/liveviewjs/main/packages/deno/mod.ts";`. (Note: DenoLand is broken for mono-repos, so we're hosting the package on GitHub for now.)
- `@liveviewjs/examples` [Node](https://www.npmjs.com/package/@liveviewjs/examples) or
  [Deno](https://raw.githubusercontent.com/floodfx/liveviewjs/main/packages/examples/mod.ts) - The package contains all the example LiveViews that
  can be run on either NodeJS or Deno. This package is runtime agnostic and can be used with either NodeJS or Deno.  See the [examples](https://github.com/floodfx/liveviewjs/tree/main/packages/examples/src/liveviews) directory for the source code.
