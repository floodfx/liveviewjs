/**
 * Interface for LiveViewServerAdaptors to implement for a given runtime and web server.
 * e.g. NodeExpressServerAdaptor or DenoOakServerAdaptor
 */
export interface LiveViewServerAdaptor<THttpMiddleware, TWsMiddleware> {
  httpMiddleware(): THttpMiddleware;
  wsMiddleware(): TWsMiddleware;
}
