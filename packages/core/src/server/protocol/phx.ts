import { BinaryUploadSerDe } from "../upload/binaryUploadSerDe";

export namespace Phx {
  export enum MsgIdx {
    joinRef = 0,
    msgRef,
    topic,
    event,
    payload,
  }

  export type Msg = [
    joinRef: string,
    msgRef: string,
    topic: string,
    event: string,
    payload: { [key: string]: unknown }
  ];

  export type UploadMsg = {
    joinRef: string;
    msgRef: string;
    topic: string;
    event: string;
    payload: Buffer; // binary data
  };

  export function parse(msg: string): Msg {
    const m = JSON.parse(msg);
    if (!Array.isArray(m) && m.length < 5) {
      throw new Error("invalid phx message");
    }
    // TODO validate other parts of message (e.g. topic, event, etc)
    return m as Msg;
  }

  export function parseBinary(raw: Buffer): Phx.UploadMsg {
    return new BinaryUploadSerDe().deserialize(raw);
  }

  export function serialize(msg: Msg): string {
    return JSON.stringify(msg);
  }
}
