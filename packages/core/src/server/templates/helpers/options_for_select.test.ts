import { options_for_select } from ".";

describe("options for select", () => {
  it("returns array options with no selected", () => {
    const options = ["a", "b", "c"];
    const result = options_for_select(options).toString();
    expect(result).toBe(`<option value="a">a</option><option value="b">b</option><option value="c">c</option>`);
  });
  it("returns array options with selected", () => {
    const options = ["a", "b", "c"];
    const result = options_for_select(options, "a").toString();
    expect(result).toBe(
      `<option value="a" selected>a</option><option value="b">b</option><option value="c">c</option>`
    );
  });

  it("returns record options with no selected", () => {
    const options = { a: "A", b: "B", c: "C" };
    const result = options_for_select(options).toString();
    expect(result).toBe(`<option value="A">a</option><option value="B">b</option><option value="C">c</option>`);
  });

  it("returns record options with selected", () => {
    const options = { a: "A", b: "B", c: "C" };
    const result = options_for_select(options, "A").toString();
    expect(result).toBe(
      `<option value="A" selected>a</option><option value="B">b</option><option value="C">c</option>`
    );
  });

  it("returns record options with selected array", () => {
    const options = { a: "A", b: "B", c: "C" };
    const result = options_for_select(options, ["A", "B"]).toString();
    expect(result).toBe(
      `<option value="A" selected>a</option><option value="B" selected>b</option><option value="C">c</option>`
    );
  });
});
