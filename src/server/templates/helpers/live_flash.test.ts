import { Flash } from "../../component/flash";
import { live_flash } from "./live_flash";

describe("test live_flash helper", () => {
  it("returns empty string for undefined flash", () => {
    const result = live_flash(undefined, "foo").toString();
    expect(result).toMatchInlineSnapshot(`""`);
  });

  it("returns empty string for empty flash", () => {
    const result = live_flash(new Flash(), "foo").toString();
    expect(result).toMatchInlineSnapshot(`""`);
  });

  it("returns rendered string for found flash", () => {
    const result = live_flash(new Flash(Object.entries({ foo: "bar" })), "foo").toString();
    expect(result).toMatchInlineSnapshot(`"bar"`);
  });
});
