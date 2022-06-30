import { PhxIncomingMessage, PhxReply, PhxProtocol } from "./types";

export const newPhxReply = (from: PhxIncomingMessage<unknown>, payload: any): PhxReply => {
  const [joinRef, messageRef, topic, ...rest] = from;
  return [joinRef, messageRef, topic, "phx_reply", payload];
};

export const newHeartbeatReply = (incoming: PhxIncomingMessage<{}>): PhxReply => {
  return [
    null,
    incoming[PhxProtocol.messageRef],
    "phoenix",
    "phx_reply",
    {
      response: {},
      status: "ok",
    },
  ];
};
