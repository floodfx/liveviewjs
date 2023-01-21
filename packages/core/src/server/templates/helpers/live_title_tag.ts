import { html, HtmlSafeString, safe } from "../htmlSafeString";
import { LiveTitleOptions } from "./live_title";

export const live_title_tag = (options: LiveTitleOptions): HtmlSafeString => {
  const { title, prefix, suffix } = options;
  const prefix_data = prefix ? safe(` data-prefix="${prefix}"`) : "";
  const suffix_data = suffix ? safe(` data-suffix="${suffix}"`) : "";
  return html`<title${prefix_data}${suffix_data}>${prefix ?? ""}${title}${suffix ?? ""}</title>`;
};
