import { html } from ".";
import { deepDiff, diffArrays } from "./diff";

describe("test diffs", () => {
  it("diff is empty if no difference between parts", () => {
    const previousState = html`something ${"foo"} blah`;
    const nextState = html`something ${"foo"} blah`;

    const diff = deepDiff(previousState.partsTree(), nextState.partsTree());
    expect(diff).toStrictEqual({});
  });

  it("dynamics array ('d' key) is different so entire 'd' array is diff", () => {
    type FooItem = { name: string; which: "foo" | string };
    const renderFooOrBar = (item: FooItem) => html`${item.which === "foo" ? "foo" : "bar"}`;

    const items: FooItem[] = [
      { name: "a", which: "foo" },
      { name: "b", which: "bar" },
      { name: "c", which: "other" },
    ];

    const previousState = html`${items.map(renderFooOrBar)}`;
    expect(previousState.partsTree()).toMatchInlineSnapshot(`
      Object {
        "0": Object {
          "d": Array [
            Array [
              "foo",
            ],
            Array [
              "bar",
            ],
            Array [
              "bar",
            ],
          ],
          "s": Array [
            "",
            "",
          ],
        },
        "s": Array [
          "",
          "",
        ],
      }
    `);
    // always render foo
    const nextState = html`${items
      .map((f) => {
        f.which = "foo";
        return f;
      })
      .map(renderFooOrBar)}`;

    const diff = deepDiff(previousState.partsTree(), nextState.partsTree());
    expect(diff).toStrictEqual({
      "0": {
        d: [["foo"], ["foo"], ["foo"]],
      },
    });
    expect(diff).toMatchInlineSnapshot(`
      Object {
        "0": Object {
          "d": Array [
            Array [
              "foo",
            ],
            Array [
              "foo",
            ],
            Array [
              "foo",
            ],
          ],
        },
      }
    `);
  });

  it("indexed dymamic value is different", () => {
    const render = (toggle: boolean = false) => html`something ${"foo"} blah ${toggle ? "bar" : "baz"}`;
    const previousState = render();
    const nextState = render(true);

    const diff = deepDiff(previousState.partsTree(), nextState.partsTree());
    expect(diff).toMatchInlineSnapshot(`
      Object {
        "1": "bar",
      }
    `);
  });

  it("keys aren't both strings nor both Parts - one is a string and one is a part", () => {
    let toggle = false;
    const previousState = html`something ${"foo"} blah ${toggle ? "bar" : html`baz`}`;
    toggle = true;
    const nextState = html`something ${"foo"} blah ${toggle ? "bar" : html`baz`}`;

    const diff = deepDiff(previousState.partsTree(), nextState.partsTree());
    expect(diff).toStrictEqual({
      "1": "bar",
    });
  });

  it("newParts has a key that oldParts doesn't have", () => {
    const subbaz = html`subbaz`;
    let toggle = false;
    const previousState = html`something ${"foo"} blah ${toggle ? "bar" : html`baz${toggle ? "" : subbaz}`}`;
    toggle = true;
    // not sure this should happen IRL because templates should be the same but for sake of testing
    const nextState = html`something ${"foo"} blah ${toggle ? "bar" : html`baz${toggle ? "" : subbaz}`} ${"newkey"}`;

    const diff = deepDiff(previousState.partsTree(), nextState.partsTree());
    console.log("prevState", previousState.partsTree(), "nextState", nextState.partsTree(), "diff", diff);
    expect(diff).toStrictEqual({
      1: "bar",
      2: "newkey",
      s: ["something ", " blah ", " ", ""],
    });
  });

  it("diffs arrays where both parts are objects but not arrays", () => {
    const oldArray = [{ 0: "a", 1: "b", s: ["1", "2", "3"] }];
    const newArray = [{ 0: "a", 1: "b", s: ["1", "2", "3"] }];
    expect(diffArrays(oldArray, newArray)).toBeFalsy();
  });

  it("diffs arrays where both parts are objects but not arrays", () => {
    const oldArray = [{ 0: "a", 1: "b", s: ["1", "2", "3"] }];
    const newArray = [{ 0: "a", 1: "c", s: ["1", "2", "3"] }];
    expect(diffArrays(oldArray, newArray)).toBeTruthy();
  });

  it("diffs arrays with objs with diff key lengths return true", () => {
    const oldArray = [{ 0: "a", 1: "b", s: ["1", "2", "3"] }];
    const newArray = [{ 0: "a", s: ["1", "2", "3"] }];
    expect(diffArrays(oldArray, newArray)).toBeTruthy();
  });

  it("diffs arrays with diff lengths return true", () => {
    const oldArray = [{ 0: "a" }, { 0: "b" }];
    const newArray = [{ 0: "a" }];
    expect(diffArrays(oldArray, newArray)).toBeTruthy();
  });

  it("diffs this", () => {
    const oldParts = require("../../../diffs/220323/oldView.json");
    const newParts = require("../../../diffs/220323/view.json");
    const diff = deepDiff(oldParts, newParts);
    console.log(JSON.stringify(diff, null, 2));
    expect(diff).toMatchInlineSnapshot(`
      Object {
        "1": Object {
          "0": Object {
            "0": Object {
              "0": "general",
              "1": "Basic Account Details",
              "s": Array [
                "
              <!-- Completed Step -->
              <a href=\\"#\\" class=\\"group\\">
                <span
                  class=\\"absolute top-0 left-0 w-1 h-full lg:w-full lg:h-1 lg:bottom-0 lg:top-auto bg-transparent group-hover:bg-gray-200\\"
                  aria-hidden=\\"true\\"></span>
                <span class=\\"px-6 py-5 flex items-start text-sm font-medium\\">
                  <span class=\\"flex-shrink-0\\">
                    <span class=\\"w-10 h-10 flex items-center justify-center rounded-full bg-green-600 \\">
                      <!-- Heroicon name: solid/check -->
                      <svg
                        class=\\"w-6 h-6 text-white\\"
                        xmlns=\\"http://www.w3.org/2000/svg\\"
                        viewBox=\\"0 0 20 20\\"
                        fill=\\"currentColor\\"
                        aria-hidden=\\"true\\">
                        <path
                          fill-rule=\\"evenodd\\"
                          d=\\"M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z\\"
                          clip-rule=\\"evenodd\\" />
                      </svg>
                    </span>
                  </span>
                  <span class=\\"mt-0.5 ml-4 min-w-0 flex flex-col\\">
                    <span class=\\"text-xs font-semibold tracking-wide uppercase\\">",
                "</span>
                    <span class=\\"text-sm font-medium text-gray-500\\">",
                "</span>
                  </span>
                </span>
              </a>
            ",
              ],
            },
          },
          "1": Object {
            "0": Object {
              "s": Array [
                "
              <!-- Current Step -->
              <span
                class=\\"absolute top-0 left-0 w-1 h-full lg:w-full lg:h-1 lg:bottom-0 lg:top-auto bg-green-600\\"
                aria-hidden=\\"true\\"></span>
              <span class=\\"px-6 py-5 flex items-start text-sm font-medium lg:pl-9\\">
                <span class=\\"flex-shrink-0\\">
                  <span class=\\"w-10 h-10 flex items-center justify-center rounded-full border-2 border-green-600\\">
                    <span class=\\"text-green-600\\">",
                "</span>
                  </span>
                </span>
                <span class=\\"mt-0.5 ml-4 min-w-0 flex flex-col\\">
                  <span class=\\"text-xs font-semibold text-green-600 tracking-wide uppercase\\">",
                "</span>
                  <span class=\\"text-sm font-medium text-gray-500\\">",
                "</span>
                </span>
              </span>
            ",
              ],
            },
          },
        },
        "2": Object {
          "0": Object {
            "0": "",
            "1": "program",
            "2": "post",
            "3": Object {
              "s": Array [
                " phx-submit=\\"save\\"",
              ],
            },
            "4": Object {
              "s": Array [
                " phx-change=\\"validate\\"",
              ],
            },
            "s": Array [
              "<form",
              " action=\\"",
              "\\" method=\\"",
              "\\"",
              "",
              ">",
            ],
          },
          "s": Array [
            "
              ",
            "
                <input type=\\"text\\" name=\\"company_name\\" placeholder=\\"Program\\" />

                <button type=\\"submit\\">Next</button>
              </form>
            ",
          ],
        },
      }
    `);
  });
});
