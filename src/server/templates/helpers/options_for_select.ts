import { html, HtmlSafeString, join } from "../htmlSafeString";

type Options = string[] | Record<string, string>;

type Selected = string | string[];

export const options_for_select = (options: Options, selected?: Selected): HtmlSafeString => {
  // string[] options
  if (typeof options === "object" && Array.isArray(options)) {
    const htmlOptions = mapArrayOptions(options, selected);
    return renderOptions(htmlOptions);
  }
  // Record<string, string> options
  else {
    const htmlOptions = mapRecordOptions(options, selected);
    return renderOptions(htmlOptions);
  }
};

function mapArrayOptions(options: string[], selected?: Selected): HtmlOption[] {
  return options.map((option) => {
    return {
      label: option,
      value: option,
      selected: selected ? isSelected(option, selected) : false,
    };
  });
}

function mapRecordOptions(options: { [key: string]: string }, selected?: Selected) {
  return Object.entries(options).map(([label, value]) => {
    return {
      label,
      value,
      selected: selected ? isSelected(value, selected) : false,
    };
  });
}

function isSelected(value: string, selected: string | string[]): boolean {
  if (Array.isArray(selected)) {
    return selected.includes(value);
  }
  return value === selected;
}

function renderOptions(options: HtmlOption[]): HtmlSafeString {
  return join(options.map(renderOption));
}

function renderOption(option: HtmlOption): HtmlSafeString {
  // prettier-ignore
  return html`<option value="${option.value}"${option.selected ? " selected" : ""}>${option.label}</option>`;
}

interface HtmlOption {
  label: string;
  value: string;
  selected: boolean;
}
