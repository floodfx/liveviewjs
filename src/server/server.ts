import { WsMessageRouter } from "./socket";

/**
 * Interface for LiveViewServerAdaptors to implement for a given runtime and web server.
 * e.g. NodeExpressServerAdaptor or DenoOakServerAdaptor
 */
export interface LiveViewServerAdaptor<TMiddlewareInterface> {
  httpMiddleware(): TMiddlewareInterface;
  wsRouter(): WsMessageRouter;
}
