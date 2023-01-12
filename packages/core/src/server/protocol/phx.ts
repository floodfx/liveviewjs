import { AllowUploadEntry } from "../socket/types";
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
    joinRef: string | null,
    msgRef: string | null,
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
  export type AllowUploadPayload = { ref: string; entries: AllowUploadEntry[] };
  export type JoinUploadPayload = {
    // this is the string returned from the AllowUpload response
    // right now it is a json string of the AllowUploadEntry but
    // perhaps it should be something else like a jwt token?
    token: string;
  };
  export type ProgressUploadPayload = {
    event: string | null;
    ref: string;
    entry_ref: string; // usually number as a string
    progress: number;
  };
  export type LivePatchPayload = {
    url: string;
  };
  export interface LiveNavPushPayload {
    kind: "push" | "replace";
    to: string;
  }

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

  export function parseBinary(raw: Buffer): Phx.Msg<Buffer> {
    const um = new BinaryUploadSerDe().deserialize(raw);
    return [um.joinRef, um.msgRef, um.topic, um.event, um.payload] as Phx.Msg<Buffer>;
  }

  export function serialize(msg: Msg): string {
    return JSON.stringify(msg);
  }
}
