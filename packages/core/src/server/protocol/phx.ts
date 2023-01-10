import { BinaryUploadSerDe } from "../upload/binaryUploadSerDe";

export namespace Phx {
  export enum MsgIdx {
    joinRef = 0,
    msgRef,
    topic,
    event,
    payload,
  }

  export type Msg<Payload = unknown> = [
    joinRef: string,
    msgRef: string,
    topic: string,
    event: string,
    payload: Payload // Type varies based on message type
  ];

  export type EventPayload<T extends string = string, V = any, E extends string = string> = {
    type: T;
    event: E;
    value: V;
    cid?: number;
  };

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
