import { form_for } from "./form_for";

describe("form_for helper", () => {
  it("returns form without options", () => {
    const result = form_for("#", "csrf").toString();
    expect(result).toMatchInlineSnapshot(`
      "
          <form action=\\"#\\" method=\\"post\\">
            <input type=\\"hidden\\" name=\\"_csrf_token\\" value=\\"csrf\\" />
        "
    `);
  });

  it("returns form with phx_submit option", () => {
    const result = form_for("#", "csrf", { phx_submit: "submit" }).toString();
    expect(result).toMatchInlineSnapshot(`
      "
          <form action=\\"#\\" method=\\"post\\" phx-submit=\\"submit\\">
            <input type=\\"hidden\\" name=\\"_csrf_token\\" value=\\"csrf\\" />
        "
    `);
  });

  it("returns form with phx_change option", () => {
    const result = form_for("#", "csrf", { phx_change: "change" }).toString();
    expect(result).toMatchInlineSnapshot(`
      "
          <form action=\\"#\\" method=\\"post\\" phx-change=\\"change\\">
            <input type=\\"hidden\\" name=\\"_csrf_token\\" value=\\"csrf\\" />
        "
    `);
  });
  it("returns form with id option", () => {
    const result = form_for("#", "csrf", { id: "id" }).toString();
    expect(result).toMatchInlineSnapshot(`
      "
          <form id=\\"id\\" action=\\"#\\" method=\\"post\\">
            <input type=\\"hidden\\" name=\\"_csrf_token\\" value=\\"csrf\\" />
        "
    `);
  });
  it("returns form with all options", () => {
    const result = form_for("#", "csrf", { phx_submit: "submit", phx_change: "change", id: "id" }).toString();
    expect(result).toMatchInlineSnapshot(`
      "
          <form id=\\"id\\" action=\\"#\\" method=\\"post\\" phx-submit=\\"submit\\" phx-change=\\"change\\">
            <input type=\\"hidden\\" name=\\"_csrf_token\\" value=\\"csrf\\" />
        "
    `);
  });
});
