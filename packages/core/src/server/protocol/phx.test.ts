import { Phx } from "./phx";

describe("phx", () => {
  it("encodes and decodes a message", () => {
    const msg: Phx.Msg = ["join", "msg", "topic", "event", {}];
    const encoded = Phx.serialize(msg);
    const decoded = Phx.parse(encoded);
    expect(decoded).toEqual(msg);
  });

  it("", () => {});
});
