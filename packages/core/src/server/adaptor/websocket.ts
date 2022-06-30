/**
 * Adaptor that enables sending websocket messages over a concrete websocket implementation.
 */
export interface WsAdaptor {
  send(message: string, errorHandler?: (err: any) => void): void;
}
