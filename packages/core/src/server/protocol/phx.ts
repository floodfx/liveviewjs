import { AllowUploadEntry } from "../socket/types";
import { BinaryUploadSerDe } from "../upload/binaryUploadSerDe";

/**
 * Phx is a namespace for Phoenix LiveView protocol related types and functions.
 */
export namespace Phx {
  /**
   * MsgIdx is an enum of the indexes of the Phx LiveView message tuple.
   */
  export enum MsgIdx {
    joinRef = 0,
    msgRef,
    topic,
    event,
    payload,
  }

  /**
   * Msg are the messages typically send from the client to the server.
   * The payload type varies based on the message type and,
   * in some cases, the joinRef and/or msgRef may be null.
   */
  export type Msg<Payload = unknown> = [
    joinRef: string | null,
    msgRef: string | null,
    topic: string,
    event: string,
    payload: Payload // Type varies based on message type
  ];

  /**
   * EventPayload is the payload for a LiveView event (click, form, blur, key, etc)
   */
  export type EventPayload<T extends string = string, V = any, E extends string = string> = {
    type: T;
    event: E;
    value: V;
    cid?: number; // LiveComponent id (if event is from a LiveComponent)
  };

  /**
   * AllowUploadPayload is the payload for the allow_upload event
   * which is initiated during binary file uploads.
   */
  export type AllowUploadPayload = {
    /**
     * ref is a string that is used to identify the upload
     */
    ref: string;
    /**
     * entries is an array of one or more entries to be uploaded
     */
    entries: AllowUploadEntry[];
  };

  /**
   * JoinUploadPayload is the payload for the join_upload event
   * which is initiated at the start of a binary file upload process.
   */
  export type JoinUploadPayload = {
    // this is the string returned from the AllowUpload response
    // right now it is a json string of the AllowUploadEntry but
    // perhaps it should be something else more opaque like a jwt token?
    token: string;
  };

  /**
   * ProgressUploadPayload is the payload for the progress_upload event
   * which is send (potentially multiple times, depending on the entry size and chunk size)
   * during a binary file upload process
   */
  export type ProgressUploadPayload = {
    event: string | null;
    ref: string;
    entry_ref: string; // usually number as a string
    progress: number;
  };

  /**
   * LivePatchPayload is the payload for the live_patch event
   * which affect the url of the `LiveView`.
   */
  export type LivePatchPayload = {
    url: string;
  };

  /**
   * LiveNavPushPayload is the payload for the live_nav_push events
   * either live_patch or live_redirect, both of which will change
   * the url of the `LiveView`.
   */
  export interface LiveNavPushPayload {
    kind: "push" | "replace";
    to: string;
  }

  /**
   * UploadMsg is the initial type that we deserialize the binary upload message into.
   * It is then converted into a Msg<Buffer> which is the type that is used throughout
   * the rest of the code.
   */
  export type UploadMsg = {
    joinRef: string;
    msgRef: string;
    topic: string;
    event: string;
    payload: Buffer; // binary data
  };

  /**
   * parse attempts to parse a string into a Msg.
   * @param msg the string to parse
   * @returns the parsed Msg
   * @throws an error if the message is invalid
   */
  export function parse(msg: string): Msg {
    const m = JSON.parse(msg);
    if (!Array.isArray(m) && m.length < 5) {
      throw new Error("invalid phx message");
    }
    // TODO validate other parts of message (e.g. topic, event, etc)
    return m as Msg;
  }

  /**
   * parseBinary attempts to parse a binary buffer into a Msg<Buffer>.
   * @param raw the binary buffer to parse
   * @returns a Msg<Buffer>
   */
  export function parseBinary(raw: Buffer): Phx.Msg<Buffer> {
    const um = new BinaryUploadSerDe().deserialize(raw);
    return [um.joinRef, um.msgRef, um.topic, um.event, um.payload] as Phx.Msg<Buffer>;
  }

  /**
   * serialize serializes a Msg into a string typically for sending across the socket back to the client.
   * @param msg the Msg to serialize
   * @returns the serialized Msg
   */
  export function serialize(msg: Msg): string {
    return JSON.stringify(msg);
  }
}
