import { live_patch } from "./live_patch";

describe("livepatch helper", () => {
  it("returns livepatch anchor", () => {
    const result = live_patch("Go to bar", {
      to: {
        path: "/bar",
        params: { a: "b" },
      },
    }).toString();
    expect(result).toBe(`<a data-phx-link="patch" data-phx-link-state="push" href="/bar?a=b">Go to bar</a>`);
  });

  it("returns livepatch anchor with no params", () => {
    const result = live_patch("Go to bar", {
      to: {
        path: "/bar",
        params: {},
      },
    }).toString();
    expect(result).toBe(`<a data-phx-link="patch" data-phx-link-state="push" href="/bar">Go to bar</a>`);
  });

  it("returns livepatch anchor with custom class", () => {
    const result = live_patch("Go to bar", {
      to: {
        path: "/bar",
        params: { a: "b" },
      },
      className: "custom-class",
    }).toString();
    expect(result).toBe(
      `<a data-phx-link="patch" data-phx-link-state="push" href="/bar?a=b" class="custom-class">Go to bar</a>`
    );
  });
});
