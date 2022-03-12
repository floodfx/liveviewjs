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
  });

  it("indexed dymamic value is different", () => {
    let toggle = false;
    const previousState = html`something ${"foo"} blah ${toggle ? "bar" : "baz"}`;
    toggle = true;
    const nextState = html`something ${"foo"} blah ${toggle ? "bar" : "baz"}`;

    const diff = deepDiff(previousState.partsTree(), nextState.partsTree());
    expect(diff).toStrictEqual({
      "1": "bar",
    });
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
});
