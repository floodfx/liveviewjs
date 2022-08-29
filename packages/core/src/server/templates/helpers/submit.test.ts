import { submit } from "./submit";

describe("submit helper", () => {
  it("returns expected submit button html", () => {
    const result = submit("submit");
    expect(result.toString()).toMatchInlineSnapshot(`"<button type=\\"submit\\">submit</button>"`);
  });

  it("returns expected submit button with phx-disable-with", () => {
    const result = submit("submit", { phx_disable_with: "Saving..." });
    expect(result.toString()).toMatchInlineSnapshot(
      `"<button type=\\"submit\\" phx-disable-with=\\"Saving...\\">submit</button>"`
    );
  });

  it("returns with disabled", () => {
    const result = submit("submit", { phx_disable_with: "Saving...", disabled: true });
    expect(result.toString()).toMatchInlineSnapshot(
      `"<button type=\\"submit\\" phx-disable-with=\\"Saving...\\" disabled>submit</button>"`
    );
  });

  it("returns with non-named attr", () => {
    const result = submit("submit", { phx_disable_with: "Saving...", "aria-label": "a button" });
    expect(result.toString()).toMatchInlineSnapshot(
      `"<button type=\\"submit\\" phx-disable-with=\\"Saving...\\" aria-label=\\"a button\\">submit</button>"`
    );
  });

  it("returns escaped content", () => {
    const result = submit("Learn More >", { phx_disable_with: "Saving...", "aria-label": "a button" });
    expect(result.toString()).toMatchInlineSnapshot(
      `"<button type=\\"submit\\" phx-disable-with=\\"Saving...\\" aria-label=\\"a button\\">Learn More &gt;</button>"`
    );
  });
});
