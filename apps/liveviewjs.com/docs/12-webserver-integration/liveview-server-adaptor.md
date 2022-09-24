---
sidebar_position: 3
---

# LiveViewServerAdaptor

LiveViewJS provides an interface that you can implement to integrate with your webserver of choice. This interface is
called `LiveViewServerAdaptor`. This is the interface that is implemented by the `NodeExpressLiveViewServer` (and
`DenoOakLiveViewServer`).

## Required Methods

`LiveViewServerAdaptor` requires that you implement the following methods:

- `httpMiddleware()`
- `wsMiddleware()`

## Digging into NodeExpressLiveViewServer

The implementation behind the `NodeExpressLiveViewServer` is where the magic of mapping HTTP and websocket requests to
LiveViewJS routes happens.

### HTTP Middleware

Let's look at the ExpressJS implementation of the `httpMiddleware` method:

```ts
httpMiddleware(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adaptor = new ExpressRequestAdaptor(req, res, this.serDe);
      const { getRequestPath } = adaptor;

      // look up LiveView for route
      const liveview = this.router[getRequestPath()];
      if (!liveview) {
        // no LiveView found for route so call next() to
        // let a possible downstream route handle the request
        next();
        return;
      }

      // defer to liveviewjs to handle the request
      const rootViewHtml = await handleHttpLiveView(
        nanoid,
        nanoid,
        liveview,
        adaptor,
        this.htmlPageTemplate,
        this.liveTitleOptions,
        this.wrapperTemplate
      );

      // check if LiveView calls for a redirect and if so, do it
      if (adaptor.redirect) {
        res.redirect(adaptor.redirect);
        return;
      }

      // otherwise render the LiveView HTML
      res.format({
        html: () => {
          res.send(rootViewHtml);
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
```

In summary, the `httpMiddleware` method does the following:

1. It creates an `ExpressRequestAdaptor` instance that wraps the ExpressJS `Request` and `Response` objects so they can
   be used by LiveViewJS.
2. It uses the LiveViewRouter to see if there is a LiveView registered for the request path.
3. If there is a LiveView registered for the request path, it calls `handleHttpLiveView` to handle the request.
   `handleHttpLiveView` is provided by LiveViewJS that connect the request to the LiveView.
4. If there is no LiveView registered for the request path, it calls `next()` to let the next middleware in the chain
   handle the request.
5. We check for redirects and if there is one, we do it.
6. Otherwise, we render the LiveView HTML.

### Websocket Middleware

Let's look at the ExpressJS implementation of the `wsMiddleware` method:

```ts
wsMiddleware(): (wsServer: WebSocketServer) => Promise<void> {
  return async (wsServer: WebSocketServer) => {
    // send websocket requests to the LiveViewJS message router
    wsServer.on("connection", (ws) => {
      const connectionId = nanoid();
      ws.on("message", async (message, isBinary) => {
        // pass websocket messages to LiveViewJS
        await this._wsRouter.onMessage(connectionId, message, new NodeWsAdaptor(ws), isBinary);
      });
      ws.on("close", async () => {
        // pass websocket close events to LiveViewJS
        await this._wsRouter.onClose(connectionId);
      });
    });
  };
}
```

In summary, the `wsMiddleware` method listens for websocket connections, messages, and close events and passes them to
the LiveViewJS message router. The `wsRouter` knows how to route websocket messages to the correct LiveView and handle
the websocket lifecycle. Not much to see here since it's all handled by LiveViewJS.

That's more or less it modulo the `ExpressRequestAdaptor`. The `ExpressRequestAdaptor` is a wrapper around the ExpressJS
`Request` and `Response` objects that provides a common interface for LiveViewJS to use. This is another necessary step
to normalize any differences between webserver implementations.
