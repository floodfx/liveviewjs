import { live_title_tag } from "./live_title_tag";

describe("live title tag helper", () => {
  it("returns live title tag", () => {
    const result = live_title_tag("title").toString();
    expect(result).toBe(`<title>title</title>`);
  });

  it("returns live title tag with prefix", () => {
    const result = live_title_tag("title", {
      prefix: "prefix ",
    }).toString();
    expect(result).toBe(`<title data-prefix="prefix ">prefix title</title>`);
  });

  it("returns live title tag with prefix and suffix", () => {
    const result = live_title_tag("title", {
      prefix: "prefix ",
      suffix: " suffix",
    }).toString();
    expect(result).toBe(`<title data-prefix="prefix " data-suffix=" suffix">prefix title suffix</title>`);
  });
});
