import { PhxIncomingMessage, PhxProtocol, PhxReply } from "./types";

export const newPhxReply = (from: PhxIncomingMessage<unknown>, payload: any): PhxReply => {
  const joinRef = from[PhxProtocol.joinRef];
  const messageRef = from[PhxProtocol.messageRef];
  const topic = from[PhxProtocol.topic];
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
