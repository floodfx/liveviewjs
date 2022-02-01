import WebSocket from 'ws';
import { LiveViewMountParams } from '..';

export enum PhxSocketProtocolNames {
  joinRef = 0,
  messageRef,
  topic,
  event,
  payload
}

export type PhxIncomingMessage<Payload> = [
  joinRef: string | null, // number
  messageRef: string, // number
  topic: "phoenix" | string,
  event: "phx_join" | "event" | "heartbeat" | "live_patch",
  payload: Payload
]

export type PhxOutgoingMessage<Payload> = [
  joinRef: string | null, // number
  messageRef: string | null, // number
  topic: "phoenix" | string,
  event: "phx_reply" | "diff" | "live_patch",
  payload: Payload
]

export interface PhxJoinPayload {
  params: LiveViewMountParams
  session: string
  static: string
  url: string
}

export type PhxJoinIncoming = PhxIncomingMessage<PhxJoinPayload>;
export type PhxHeartbeatIncoming = PhxIncomingMessage<{}>;
export type PhxLivePatchIncoming = PhxIncomingMessage<{ url: string }>;


export type Diff = { [key: string]: string | Diff }

export type RenderedNode = { [key: string]: string | RenderedNode } & { [key in "s"]: readonly string[] }

export interface PhxReplyPayload {
  response: {
    rendered?: RenderedNode
    diff?: Diff
  }
  status: "ok"
}

export type PhxReply = PhxOutgoingMessage<PhxReplyPayload>;
export type PhxDiffReply = PhxOutgoingMessage<Diff>;

export interface PhxLivePatchPushPayload {
  kind: "push",
  to: string,
}
export type PhxOutgoingLivePatchPush = PhxOutgoingMessage<PhxLivePatchPushPayload>;

export interface PhxEventPayload<Type extends string, Value> {
  type: Type,
  event: string,
  value: Value
}

export interface PhxEventUploads {
  uploads: { [key: string]: unknown }
}

//{type: "click", event: "down", value: {value: ""}}
export type PhxClickPayload = PhxEventPayload<"click", { value: { value: string } }>;

//{"type":"form","event":"update","value":"seats=3&_target=seats","uploads":{}}
export type PhxFormPayload = PhxEventPayload<"form", { value: string }> & PhxEventUploads;



// See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
// for all the string values for the key that kicked off the event
//{type: "keyup", event: "key_update", value: {key: "ArrowUp"}}
export type PhxKeyUpPayload = PhxEventPayload<"keyup", { value: { key: string } }>;
export type PhxKeyDownPayload = PhxEventPayload<"keydown", { value: { key: string } }>;


// export type PhxClickEvent = PhxIncomingMessage<PhxClickPayload>
// export type PhxFormEvent = PhxIncomingMessage<PhxFormPayload>


export const newPhxReply = (from: PhxIncomingMessage<unknown>, payload: any): PhxReply => {
  return [
    from[0],
    from[1],
    from[2],
    "phx_reply",
    payload
  ]
}

export const newHeartbeatReply = (incoming: PhxIncomingMessage<{}>): PhxReply => {
  return [
    null,
    incoming[PhxSocketProtocolNames.messageRef],
    "phoenix",
    "phx_reply",
    {
      response: {},
      status: "ok"
    }
  ]
}