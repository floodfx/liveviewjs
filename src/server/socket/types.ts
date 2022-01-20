export enum PhxSocketProtocolNames {
  joinRef = 0,
  messageRef,
  topic,
  event,
  payload
}

export type PhxSocketProtocol<Payload> = [
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

export type PhxJoin = PhxSocketProtocol<PhxJoinPayload>;

export type Dynamics = { [key: number]: string | Dynamics }

export type RenderedNode = { [key: number]: string | RenderedNode } & { [key in "s"]: readonly string[] }

export interface PhxReplyPayload {
  response: {
    rendered?: RenderedNode
    diff?: Dynamics
  }
  status: "ok"
}

export type PhxReply = PhxSocketProtocol<PhxReplyPayload>;

export interface PhxEventPayload<T> {
  type: string,
  event: string,
  value: T
}

export type PhxEvent<T> = PhxSocketProtocol<PhxEventPayload<T>>

//{type: "click", event: "down", value: {value: ""}}
export type PhxClickEvent = PhxEvent<{ value: { value: string } }>

export const newHeartbeatReply = (incoming: PhxSocketProtocol<{}>): PhxReply => {
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