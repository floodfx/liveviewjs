import { text_input, telephone_input } from "./inputs";
import { z } from "zod";
import { error_tag } from ".";
import { newChangesetFactory } from "../../changeset";

export const TestObjectSchema = z.object({
  foo: z.string(),
  bar: z.number().min(2).max(100),
});

type TestObject = z.infer<typeof TestObjectSchema>;

const testChangeset = newChangesetFactory<TestObject>(TestObjectSchema);
const emptyChangeset = testChangeset({}, {});

describe("inputs helper", () => {
  it("returns basic text input", () => {
    const result = text_input<TestObject>(emptyChangeset, "foo").toString();
    expect(result).toBe(`<input type="text" id="input_foo" name="foo" value=""/>`);
  });

  it("returns basic text input with placeholder", () => {
    const result = text_input<TestObject>(emptyChangeset, "foo", {
      placeholder: "placeholder",
    }).toString();
    expect(result).toBe(`<input type="text" id="input_foo" name="foo" value="" placeholder="placeholder"/>`);
  });

  it("returns basic text input with placeholder, autocomplete", () => {
    const result = text_input<TestObject>(emptyChangeset, "foo", {
      placeholder: "placeholder",
      autocomplete: "off",
    }).toString();
    expect(result).toBe(
      `<input type="text" id="input_foo" name="foo" value="" autocomplete="off" placeholder="placeholder"/>`
    );
  });

  it("returns basic text input with placeholder, autocomplete, debounce", () => {
    const result = text_input<TestObject>(emptyChangeset, "foo", {
      placeholder: "placeholder",
      autocomplete: "off",
      phx_debounce: "blur",
    }).toString();
    expect(result).toBe(
      `<input type="text" id="input_foo" name="foo" value="" autocomplete="off" placeholder="placeholder" phx-debounce="blur"/>`
    );
  });

  it("returns text input with placeholder, autocomplete, debounce, type=tel", () => {
    const result = text_input<TestObject>(emptyChangeset, "foo", {
      placeholder: "placeholder",
      autocomplete: "off",
      phx_debounce: "blur",
      type: "tel",
    }).toString();
    expect(result).toBe(
      `<input type="tel" id="input_foo" name="foo" value="" autocomplete="off" placeholder="placeholder" phx-debounce="blur"/>`
    );
  });

  it("returns telephone_input with placeholder, autocomplete, debounce", () => {
    const result = telephone_input<TestObject>(emptyChangeset, "foo", {
      placeholder: "placeholder",
      autocomplete: "off",
      phx_debounce: "blur",
    }).toString();
    expect(result).toBe(
      `<input type="tel" id="input_foo" name="foo" value="" autocomplete="off" placeholder="placeholder" phx-debounce="blur"/>`
    );
  });

  it("returns empty error tag when changeset has no action", () => {
    const result = error_tag<TestObject>(emptyChangeset, "foo").toString();
    expect(result).toBe(``);
  });

  it("returns error tag when errors", () => {
    const actionChangeset = testChangeset({}, {}, "save");
    const result = error_tag<TestObject>(actionChangeset, "foo").toString();
    expect(result).toBe(`<span class="invalid-feedback" phx-feedback-for="foo">Required</span>`);
  });

  it("returns error tag when errors with custom class", () => {
    const actionChangeset = testChangeset({}, {}, "save");
    const result = error_tag<TestObject>(actionChangeset, "foo", {
      className: "custom-class",
    }).toString();
    expect(result).toBe(`<span class="custom-class" phx-feedback-for="foo">Required</span>`);
  });
});
