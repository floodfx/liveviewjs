import { submit } from "./submit";

describe("submit helper", () => {
  it("returns expected submit button html", () => {
    const result = submit("submit").toString();
    expect(result).toBe(`<button type="submit">submit</button>`);
  });

  it("returns expected submit button with phx-disable-with", () => {
    const result = submit("submit", { phx_disable_with: "Saving..." }).toString();
    expect(result).toBe(`<button type="submit" phx-disable-with="Saving...">submit</button>`);
  });
});
