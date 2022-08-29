import { LiveViewMountParams } from "..";

export enum PhxProtocol {
  joinRef = 0,
  messageRef,
  topic,
  event,
  payload,
}

export type PhxIncomingMessage<Payload> = [
  joinRef: string | null, // number
  messageRef: string | null, // number
  topic: "phoenix" | string,
  event: "phx_join" | "event" | "heartbeat" | "live_patch" | "phx_leave" | "allow_upload" | "progress",
  payload: Payload
];

export type PhxOutgoingMessage<Payload> = [
  joinRef: string | null, // number
  messageRef: string | null, // number
  topic: "phoenix" | string,
  event: "phx_reply" | "diff" | "live_patch" | "live_redirect",
  payload: Payload
];

// guess at Flash shape
export type PhxFlash = {
  info?: string;
  error?: string;
};

export interface PhxJoinPayload {
  params: LiveViewMountParams;
  session: string;
  static: string;
  url?: string;
  redirect?: string;
  flash?: PhxFlash | null;
}

export type PhxJoinIncoming = PhxIncomingMessage<PhxJoinPayload>;
export type PhxHeartbeatIncoming = PhxIncomingMessage<{}>;
export type PhxLivePatchIncoming = PhxIncomingMessage<{ url: string }>;

export type AllowUploadEntry = {
  last_modified: number;
  name: string;
  size: number;
  type: string;
  ref: string;
};

export type PhxAllowUploadIncoming = PhxIncomingMessage<{ ref: string; entries: AllowUploadEntry[] }>;
export type PhxJoinUploadIncoming = PhxIncomingMessage<{
  // this is the string returned from the AllowUpload response
  // right now it is a json string of the AllowUploadEntry but
  // perhaps it should be something else like a jwt token?
  token: string;
}>;
export type PhxProgressUploadIncoming = PhxIncomingMessage<{
  event: string | null;
  ref: string;
  entry_ref: string; // usually number as a string
  progress: number;
}>;

export type Diff = { [key: string]: unknown | Diff };

export type RenderedNode = { [key: string]: string | RenderedNode } & { [key in "s"]: readonly string[] };

export interface PhxReplyPayload {
  response: {
    rendered?: RenderedNode;
    diff?: Diff;
  };
  status: "ok";
}

export type PhxReply = PhxOutgoingMessage<PhxReplyPayload>;
export type PhxDiffReply = PhxOutgoingMessage<Diff>;

export interface PhxLiveNavPushPayload {
  kind: "push" | "replace";
  to: string;
}
export type PhxOutgoingLivePatchPush = PhxOutgoingMessage<PhxLiveNavPushPayload>;

export type PhxOutgoingLiveRedirectPush = PhxOutgoingMessage<PhxLiveNavPushPayload>;

export interface PhxEventPayload<TType extends string, TValue, TEvent extends string = string> {
  type: TType;
  event: TEvent;
  value: TValue;
  cid?: number;
}

export type PhxEventUpload = {
  path: string; // config path
  last_modified: number; // ts of last modified
  ref: string; // order of upload
  name: string; // original filename
  type: string; // mime type
  size: number; // bytes
};

export interface PhxEventUploads {
  uploads?: {
    [key: string]: PhxEventUpload[];
  };
}

//{type: "click", event: "down", value: {value: ""}}
export type PhxClickPayload = PhxEventPayload<"click", { value: string }>;
// lv:clear-flash is a special click event with hardcoded "event" value
// internal message called to clear flash messages from the session
// e.g. {"type":"click","event":"lv:clear-flash","value":{"key":"info"}}
export type PhxLVClearFlashPayload = PhxEventPayload<"click", { key: string }, "lv:clear-flash">;

//{"type":"form","event":"update","value":"seats=3&_target=seats","uploads":{}}
export type PhxFormPayload = PhxEventPayload<"form", string> & PhxEventUploads;

// See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
// for all the string values for the key that kicked off the event
// {type: "keyup", event: "key_update", value: {key: "ArrowUp"}}
// {type: "keyup", event: "key_update", value: {key: "ArrowUp", value: ""}}
// {type: "keyup", event: "key_update", value: {key: "ArrowUp", value: "foo"}}
// NOTE: these payloads are the same for phx-window-key* events and phx-key* events
export type PhxKeyUpPayload = PhxEventPayload<"keyup", { key: string; value?: string }>;
export type PhxKeyDownPayload = PhxEventPayload<"keydown", { key: string; value?: string }>;

// Focus and Blur events
// {type: "focus", event: "focus", value: {value: ""}}
// {type: "blur", event: "blur", value: {value: ""}}
export type PhxFocusPayload = PhxEventPayload<"focus", { value: string }>;
export type PhxBlurPayload = PhxEventPayload<"blur", { value: string }>;

// Hook event
// initiated by calling this.pushEvent("edit"...) in client hook in liveview.js
// {type: "hook", event: "edit", value: {id: "abc"}}
export type PhxHookPayload = PhxEventPayload<"hook", Record<string, string>>;

export type PhxMessage =
  // incoming from client
  | { type: "phx_join"; message: PhxJoinIncoming }
  | { type: "heartbeat"; message: PhxHeartbeatIncoming }
  | {
      type: "event";
      message: PhxIncomingMessage<
        | PhxClickPayload
        | PhxFormPayload
        | PhxKeyDownPayload
        | PhxKeyUpPayload
        | PhxFocusPayload
        | PhxBlurPayload
        | PhxHookPayload
      >;
    }
  | { type: "live_patch"; message: PhxLivePatchIncoming }
  | { type: "phx_leave"; message: PhxIncomingMessage<{}> }
  | { type: "allow_upload"; message: PhxAllowUploadIncoming }
  | { type: "phx_join_upload"; message: PhxJoinUploadIncoming }
  | { type: "upload_binary"; message: { data: Buffer } }
  | { type: "progress"; message: PhxProgressUploadIncoming };
