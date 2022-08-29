import { BinaryUploadSerDe } from "./binaryUploadSerDe";

describe("binary upload serde test", () => {
  it("live_img_preview", async () => {
    const serDe = new BinaryUploadSerDe();

    const byteSize = 1000;
    const parts = {
      joinRef: "joinRef",
      messageRef: "msgRef",
      topic: "lvu:$0",
      event: "binary_upload",
      data: Buffer.alloc(byteSize),
    };
    const data = await serDe.serialize(parts);
    expect(data.length).toBe(
      1000 + // data length
        5 + // size header
        parts.joinRef.length +
        parts.messageRef.length +
        parts.topic.length +
        parts.event.length
    );

    const parts2 = await serDe.deserialize(data);
    expect(parts2.joinRef).toBe(parts.joinRef);
    expect(parts2.messageRef).toBe(parts.messageRef);
    expect(parts2.topic).toBe(parts.topic);
    expect(parts2.event).toBe(parts.event);
    expect(parts2.data.length).toBe(byteSize);
  });
});
