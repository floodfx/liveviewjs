import { form_for } from "./form_for";

describe("form_for helper", () => {
  it("returns form without options", () => {
    const result = form_for("#").toString();
    expect(result).toBe(`<form action="#" method="post">`);
  });

  it("returns form with phx_submit option", () => {
    const result = form_for("#", { phx_submit: "submit" }).toString();
    expect(result).toBe(`<form action="#" method="post" phx-submit="submit">`);
  });

  it("returns form with phx_change option", () => {
    const result = form_for("#", { phx_change: "change" }).toString();
    expect(result).toBe(`<form action="#" method="post" phx-change="change">`);
  });
  it("returns form with id option", () => {
    const result = form_for("#", { id: "id" }).toString();
    expect(result).toBe(`<form id="id" action="#" method="post">`);
  });
  it("returns form with all options", () => {
    const result = form_for("#", { phx_submit: "submit", phx_change: "change", id: "id" }).toString();
    expect(result).toBe(`<form id="id" action="#" method="post" phx-submit="submit" phx-change="change">`);
  });
});