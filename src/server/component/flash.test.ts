import { Flash } from "./flash";

describe("test flash", () => {
  it("test flash", () => {
    const flash = new Flash();
    flash.set("foo", "bar");
    expect(flash.getFlash("foo")).toEqual("bar");
    expect(flash.getFlash("foo")).toBeUndefined();
  });
});
