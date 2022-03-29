export interface WsAdaptor {
  send(message: string, errorHandler?: (err: any) => void): void;
}
