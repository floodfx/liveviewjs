import { WebSocket } from "ws";
import { WsAdaptor } from "liveviewjs";

/**
 * Node specific adaptor to enabled the WsMessageRouter to send messages back
 * to the client via WebSockets.
 */
export class NodeWsAdaptor implements WsAdaptor {
  private ws: WebSocket;
  constructor(ws: WebSocket) {
    this.ws = ws;
  }
  send(message: string, errorHandler?: (err: any) => void): void {
    this.ws.send(message, errorHandler);
  }
}
