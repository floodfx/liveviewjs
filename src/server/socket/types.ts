export enum PhxSocketProtocolNames {
  joinRef = 0,
  messageRef,
  topic,
  event,
  payload
}

export type PhxSocketProtocol<Payload> = [
  joinRef: number,
  messageRef: number,
  topic: number,
  event: "phx_reply" | string,
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