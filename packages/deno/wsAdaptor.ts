import type { WsAdaptor } from "./liveviewjs.ts";

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
      }
    }
  }
}