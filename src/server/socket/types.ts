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
  event: "phx_join" | "event" | "heartbeat",
  payload: Payload
]

export type PhxOutgoingMessage<Payload> = [
  joinRef: string | null, // number
  messageRef: string, // number
  topic: "phoenix" | string,
  event: "phx_reply",
  payload: Payload
]

export interface PhxJoinPayload {
  params: { _csrf: string } & { [key: string]: string }
  session: string
  static: string
  url: string
}

export type PhxJoinIncoming = PhxIncomingMessage<PhxJoinPayload>;
export type PhxHeartbeatIncoming = PhxIncomingMessage<{}>;

export type Dynamics = { [key: number]: string | Dynamics }

export type RenderedNode = { [key: number]: string | RenderedNode } & { [key in "s"]: readonly string[] }

export interface PhxReplyPayload {
  response: {
    rendered?: RenderedNode
    diff?: Dynamics
  }
  status: "ok"
}

export type PhxReply = PhxOutgoingMessage<PhxReplyPayload>;

export interface PhxEventPayload<Type extends string,Value> {
  type: Type,
  event: string,
  value: Value
}

export interface PhxEventUploads {
  uploads: { [key: string]: unknown }
}

//{type: "click", event: "down", value: {value: ""}}
export type PhxClickPayload = PhxEventPayload<"click",{ value: { value: string } }>;

//{"type":"form","event":"update","value":"seats=3&_target=seats","uploads":{}}
export type PhxFormPayload = PhxEventPayload<"form",{ value: string }> & PhxEventUploads;


export type PhxClickEvent = PhxIncomingMessage<PhxClickPayload>
export type PhxFormEvent = PhxIncomingMessage<PhxFormPayload>


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