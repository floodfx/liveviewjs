import { z } from "zod";
import { newChangesetFactory } from "./changeset";

const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
});

type Person = z.infer<typeof PersonSchema>;

describe("test changeset", () => {
  const changeset = newChangesetFactory<Person>(PersonSchema);

  it("empty changeset (e.g. no action) is always valid even with invalid input", async () => {
    let empty = changeset({}, {});
    expect(empty.valid).toBe(true);

    // @ts-ignore - allow age to be set to string
    empty = changeset({}, { name: 1, age: "foo" });
    expect(empty.valid).toBe(true);
  });

  it("changeset with action will be invalid with invalid input", async () => {
    const actionChangeset = changeset({}, {}, "some_action");
    expect(actionChangeset.valid).toBe(false);
    expect(actionChangeset.errors).toBeDefined();
    expect(actionChangeset.errors!.age).toBeDefined();
    expect(actionChangeset.errors!.name).toBeDefined();
  });

  it("changeset with _target attribute returns only errors for that target", async () => {
    const actionChangeset = changeset({}, { _target: "name" } as any, "some_action");
    expect(actionChangeset.valid).toBe(false);
    expect(actionChangeset.errors).toBeDefined();
    expect(actionChangeset.errors!.age).not.toBeDefined();
    expect(actionChangeset.errors!.name).toBeDefined();
  });

  it("changeset data use zod result vs merged data depending on success", async () => {
    // @ts-ignore - allow additional properties to be added
    const successChangeset = changeset({ age: 10 }, { name: "foo", something: "bar" }, "some_action");
    expect(successChangeset.valid).toBe(true);
    // "something" prop removed by zod
    expect(successChangeset.data).toEqual({ name: "foo", age: 10 });

    // @ts-ignore - allow additional properties to be added and name to be set to number
    const failureChangeset = changeset({ age: 10 }, { name: 1, something: "bar" }, "some_action");
    expect(failureChangeset.valid).toBe(false);
    // @ts-ignore - allow additional properties to be added and name to be set to number
    expect(failureChangeset.data).toEqual({ age: 10, name: 1, something: "bar" }); // "something" prop NOT removed by zod
  });
});
