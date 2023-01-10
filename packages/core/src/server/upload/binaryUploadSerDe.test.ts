import { Phx } from "../protocol/phx";
import { BinaryUploadSerDe } from "./binaryUploadSerDe";

describe("binary upload serde test", () => {
  it("live_img_preview", async () => {
    const serDe = new BinaryUploadSerDe();

    const byteSize = 1000;
    const parts = {
      joinRef: "joinRef",
      msgRef: "msgRef",
      topic: "lvu:$0",
      event: "binary_upload",
      payload: Buffer.alloc(byteSize),
    } as Phx.UploadMsg;
    const data = await serDe.serialize(parts);
    expect(data.length).toBe(
      1000 + // data length
        5 + // size header
        parts.joinRef.length +
        parts.msgRef.length +
        parts.topic.length +
        parts.event.length
    );

    const parts2 = await serDe.deserialize(data);
    expect(parts2.joinRef).toBe(parts.joinRef);
    expect(parts2.msgRef).toBe(parts.msgRef);
    expect(parts2.topic).toBe(parts.topic);
    expect(parts2.event).toBe(parts.event);
    expect(parts2.payload.length).toBe(byteSize);
  });
});
