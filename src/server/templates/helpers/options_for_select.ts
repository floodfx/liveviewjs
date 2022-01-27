import html, { HtmlSafeString, join } from "..";

type Options =
  string[] |
  { [key: string]: string }

type Selected = string | string[]

export const options_for_select = (options: Options, selected: Selected): HtmlSafeString => {
  // string[] options
  if (typeof options === "object" && Array.isArray(options)) {
    const htmlOptions = mapOptionsValueArrayAndSelectedToHtmlOptions(options, selected);
    return renderOptions(htmlOptions);
  }
  // key-value options
  else {//if (typeof options === "object" && !Array.isArray(options)) {
    const htmlOptions = mapOptionsLabelValuesAndSelectedToHtmlOptions(options, selected);
    return renderOptions(htmlOptions);
  }

}

function isSelected(value: string, selected: string | string[]): boolean {
  if (Array.isArray(selected)) {
    return selected.includes(value);
  }
  return value === selected;
}

function mapOptionsValueArrayAndSelectedToHtmlOptions(options: string[], selected: Selected): HtmlOption[] {
  return options.map((option) => {
    return {
      label: option,
      value: option,
      selected: isSelected(option, selected)
    }
  })
}

function mapOptionsLabelValuesAndSelectedToHtmlOptions(options: { [key: string]: string }, selected: Selected) {
  return Object.entries(options).map(([label, value]) => {
    return {
      label,
      value,
      selected: isSelected(value, selected)
    }
  })
}


function renderOptions(options: HtmlOption[]): HtmlSafeString {
  return join(options.map(renderOption));
}

function renderOption(option: HtmlOption): HtmlSafeString {
  return html`<option value="${option.value}" ${option.selected ? "selected" : ""}>${option.label}</option>`;
}

interface HtmlOption {
  label: string;
  value: string;
  selected: boolean
}

interface HtmlOptionGroup {
  label: string;
  options: HtmlOption[];
}