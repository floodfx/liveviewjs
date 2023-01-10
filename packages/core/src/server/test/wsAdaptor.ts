import { WsAdaptor, WsCloseListener, WsMsgListener } from "../adaptor";

export class TestWsAdaptor implements WsAdaptor {
  #send: jest.Mock;
  #closeListener: WsCloseListener;
  #msgListener: WsMsgListener;
  constructor(send: jest.Mock, closeListener: jest.Mock, msgListener: jest.Mock) {
    this.#send = send;
    this.#closeListener = closeListener;
    this.#msgListener = msgListener;
  }
  subscribeToClose(closeListener: WsCloseListener): void {
    this.#closeListener = closeListener;
  }
  send(message: string, errorHandler?: ((err: any) => void) | undefined): void {
    this.#send(message);
  }
  subscribeToMessages(msgListener: WsMsgListener): void {
    this.#msgListener = msgListener;
  }

  sendIncomingMsg(msg: string) {
    this.#msgListener(Buffer.from(msg), false);
  }
}
