import { escapehtml, html, safe } from "../htmlSafeString";

interface SubmitOptions {
  phx_disable_with?: string;
  disabled?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export const submit = (label: string, options?: SubmitOptions) => {
  const attrs = Object.entries(options || {}).reduce((acc, [key, value]) => {
    if (key === "disabled") {
      acc += value ? safe(` disabled`) : "";
    } else if (key === "phx_disable_with") {
      acc += safe(` phx-disable-with="${escapehtml(value)}"`);
    } else {
      acc += safe(` ${key}="${escapehtml(value)}"`);
    }
    return acc;
  }, "");
  // prettier-ignore
  return html`<button type="submit"${safe(attrs)}>${label}</button>`;
};
