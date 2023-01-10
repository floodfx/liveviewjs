export type WsMsgListener = (data: Buffer, isBinary: boolean) => void;
export type WsCloseListener = () => void;
/**
 * Adaptor that enables sending websocket messages over a concrete websocket implementation.
 */
export interface WsAdaptor {
  send(message: string, errorHandler?: (err: any) => void): void;
  subscribeToMessages(msgListener: WsMsgListener): Promise<void> | void;
  subscribeToClose(closeListener: WsCloseListener): Promise<void> | void;
}
