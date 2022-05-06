import type { WsAdaptor } from "../deps.ts";

/**
 * Deno specific adaptor to enabled the WsMessageRouter to send messages back
 * to the client via WebSockets.  This is very simple because all the logic resides
 * in the LiveViewJS WsMessageRouter.
 */
export class DenoWsAdaptor implements WsAdaptor {
  private ws: WebSocket;
  constructor(ws: WebSocket) {
    this.ws = ws;
  }
  send(message: string, errorHandler?: (err: any) => void): void {
    try {
      this.ws.send(message);
    } catch (e) {
      if (errorHandler) {
        errorHandler(e);
      } else {
        console.error(e);
      }
    }
  }
}
