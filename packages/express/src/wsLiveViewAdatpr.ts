import { WebSocket } from "ws";
import { WsAdaptor } from "liveviewjs";

export class NodeWsAdaptor implements WsAdaptor {
  private ws: WebSocket;
  constructor(ws: WebSocket) {
    this.ws = ws;
  }
  send(message: string, errorHandler?: (err: any) => void): void {
    this.ws.send(message, errorHandler);
  }
}
