import { WsAdaptor, WsCloseListener, WsMsgListener } from "../adaptor";

export class TestWsAdaptor implements WsAdaptor {
  private sendFn: (msg: string) => void;
  #closeListener: WsCloseListener;
  #msgListener: WsMsgListener;
  closed: boolean = false;
  constructor(sendFn: (msg: string) => void) {
    this.sendFn = sendFn;
  }
  subscribeToClose(closeListener: WsCloseListener): void {
    this.#closeListener = closeListener;
  }
  send(message: string, errorHandler?: ((err: any) => void) | undefined): void {
    this.sendFn(message);
  }
  subscribeToMessages(msgListener: WsMsgListener): void {
    this.#msgListener = msgListener;
  }
  isClosed(): boolean {
    return this.closed;
  }

  async sendIncomingMsg(msg: string) {
    await this.#msgListener(Buffer.from(msg), false);
  }
}
