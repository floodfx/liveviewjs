import { html, safe } from "..";

interface SubmitOptions {
  phx_disable_with: string;
}

export const submit = (label: string, options?: SubmitOptions) => {
  const phx_disable_with = options?.phx_disable_with ? safe(` phx-disable-with="${options.phx_disable_with}"`) : "";
  // prettier-ignore
  return html`<button type="submit"${phx_disable_with}>${label}</button>`;
};
