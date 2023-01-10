import type { WsAdaptor, WsCloseListener, WsMsgListener } from "../deps.ts";

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
  subscribeToMessages(msgListener: WsMsgListener): void | Promise<void> {
    this.ws.onmessage = async (message) => {
      const isBinary = message.data instanceof ArrayBuffer;
      // prob a better way to take ArrayBuffer and turn it into a Buffer
      // but this works for now
      const data = isBinary ? Buffer.from(message.data) : message.data;
      await msgListener(data, isBinary);
    };
  }
  subscribeToClose(closeListener: WsCloseListener): void | Promise<void> {
    this.ws.onclose = closeListener;
  }
}
