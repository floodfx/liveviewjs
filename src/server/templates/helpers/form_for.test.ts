import { form_for } from "./form_for";

describe("form_for helper", () => {
  it("returns form without options", () => {
    const result = form_for("#");
    expect(result).toBe(`<form action="#" method="post">`);
  });

  it("returns form with phx_submit option", () => {
    const result = form_for("#", { phx_submit: "submit" });
    expect(result).toBe(`<form action="#" method="post" phx-submit="submit">`);
  });

  it("returns form with phx_change option", () => {
    const result = form_for("#", { phx_change: "change" });
    expect(result).toBe(`<form action="#" method="post" phx-change="change">`);
  });
  it("returns form with all options", () => {
    const result = form_for("#", { phx_submit: "submit", phx_change: "change" });
    expect(result).toBe(`<form action="#" method="post" phx-submit="submit" phx-change="change">`);
  });
});