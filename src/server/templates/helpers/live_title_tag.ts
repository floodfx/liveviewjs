import { html, HtmlSafeString, safe } from "../htmlSafeString";

interface LiveTitleTagOptions {
  prefix?: string;
  suffix?: string;
}

export const live_title_tag = (title: string, options?: LiveTitleTagOptions): HtmlSafeString => {
  const { prefix, suffix } = options ?? {};
  const prefix_data = prefix ? safe(` data-prefix="${prefix}"`) : "";
  const suffix_data = suffix ? safe(` data-suffix="${suffix}"`) : "";
  return html`<title${prefix_data}${suffix_data}>${prefix ?? ""}${title}${suffix ?? ""}</title>`;
};
