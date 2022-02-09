import { LiveViewChangeset } from "../../component/types";
import html from ".."

interface InputOptions {
  placeholder?: string
  autocomplete?: "off" | "on"
  phx_debounce?: number | "blur" | "focus"
  type?: "text" | "tel"
}

export const text_input = <T>(changeset: LiveViewChangeset<T>, key: keyof T, options?: InputOptions) => {
  const placeholder = options?.placeholder ? "placeholder=\"" + options.placeholder + "\"" : "";
  const autocomplete = options?.autocomplete ? "autocomplete=\"" + options.autocomplete + "\"" : "";
  const phx_debounce = options?.phx_debounce ? "phx-debounce=\"" + options.phx_debounce + "\"" : "";
  const type = options?.type ?? "text";
  const id = `input_${key}`;
  const value = changeset.data[key] ?? "";
  return html`
    <input type="${type}" id="${id}" name="${key}" value="${value}" ${autocomplete} ${placeholder} ${phx_debounce} />
  `
}

interface TelephoneInputOptions extends Omit<InputOptions, "type"> { }

export const telephone_input = <T>(changeset: LiveViewChangeset<T>, key: keyof T, options?: TelephoneInputOptions) => {
  return text_input(changeset, key, { ...options, type: "tel" });
}

interface ErrorTagOptions {
  className?: string
}

export const error_tag = <T>(changeset: LiveViewChangeset<T>, key: keyof T, options?: ErrorTagOptions) => {
  const error = changeset.errors ? changeset.errors[key] : undefined;
  if (changeset.action && error) {
    const className = options?.className ?? "invalid-feedback";
    return html`
      <span class="${className}" phx-feedback-for="${key}">${error}</span>
    `
  }
  return html``
}