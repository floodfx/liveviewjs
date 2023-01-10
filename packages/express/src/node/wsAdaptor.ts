import { WsAdaptor, WsCloseListener, WsMsgListener } from "liveviewjs";
import { WebSocket } from "ws";

/**
 * Node specific adaptor to enabled the WsMessageRouter to send messages back
 * to the client via WebSockets.
 */
export class NodeWsAdaptor implements WsAdaptor {
  #ws: WebSocket;
  constructor(ws: WebSocket) {
    this.#ws = ws;
  }
  subscribeToMessages(msgListener: WsMsgListener): void | Promise<void> {
    this.#ws.on("message", msgListener);
  }
  subscribeToClose(closeListener: WsCloseListener): void | Promise<void> {
    this.#ws.on("close", closeListener);
  }
  send(message: string, errorHandler?: (err: any) => void): void {
    this.#ws.send(message, errorHandler);
  }
}
