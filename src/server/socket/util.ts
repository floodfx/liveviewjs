import { PhxIncomingMessage, PhxReply, PhxSocketProtocolNames } from "./types";

export const newPhxReply = (from: PhxIncomingMessage<unknown>, payload: any): PhxReply => {
  return [
    from[PhxSocketProtocolNames.joinRef],
    from[PhxSocketProtocolNames.messageRef],
    from[PhxSocketProtocolNames.topic],
    "phx_reply",
    payload,
  ];
};

export const newHeartbeatReply = (incoming: PhxIncomingMessage<{}>): PhxReply => {
  return [
    null,
    incoming[PhxSocketProtocolNames.messageRef],
    "phoenix",
    "phx_reply",
    {
      response: {},
      status: "ok",
    },
  ];
};
