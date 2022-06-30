import { PhxClickPayload, PhxIncomingMessage, PhxProtocol } from "./types";
import { newHeartbeatReply, newPhxReply } from "./util";

describe("test utils", () => {
  it("valid heartbeat", () => {
    const hbReply = newHeartbeatReply([null, "1", "phoenix", "heartbeat", {}]);
    expect(hbReply).toEqual([
      null,
      "1",
      "phoenix",
      "phx_reply",
      {
        response: {},
        status: "ok",
      },
    ]);
  });

  it("valid phxReply", () => {
    const incoming: PhxIncomingMessage<PhxClickPayload> = [
      "1",
      "2",
      "topic",
      "event",
      { type: "click", event: "down", value: { value: "string" } },
    ];

    const replyPayload = {
      response: {},
      status: "ok",
    };
    const reply = newPhxReply(incoming, replyPayload);

    expect(reply).toEqual([
      incoming[PhxProtocol.joinRef],
      incoming[PhxProtocol.messageRef],
      incoming[PhxProtocol.topic],
      "phx_reply",
      replyPayload,
    ]);
  });
});
