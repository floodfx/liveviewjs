---
sidebar_position: 3
---

# Support Webserver "X"

If you want to use LiveViewJS with a webserver that is not supported out of the box, you can implement the
`LiveViewServerAdaptor` interface and plug it into your webserver.

Essentially, you'll need to be able to intercept HTTP and websocket requests and pass them to the LiveViewJS library.
The LiveViewJS library will then handle the requests and return the appropriate responses.

## Look at the existing integrations

Checkout the LiveViewJS source code and look at the
[`NodeExpressLiveViewServer`](https://github.com/floodfx/liveviewjs/blob/main/packages/express/src/node/server.ts) and
[`DenoOakLiveViewServer`](https://github.com/floodfx/liveviewjs/blob/main/packages/deno/src/deno/server.ts) classes.
These are the two webserver integrations that are supported out of the box.

## Open an issue

We are happy to help you get LiveViewJS working with your webserver. If you
[open an issue](https://github.com/floodfx/liveviewjs/issues) on the LiveViewJS GitHub repo, we'll be happy to support
you.
