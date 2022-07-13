import { html, HtmlSafeString, safe } from "../htmlSafeString";

interface LiveViewPatchHelperOptions {
  to: {
    path: string;
    params?: Record<string, string>;
  };
  className?: string;
}

function buildHref(options: LiveViewPatchHelperOptions) {
  const { path, params } = options.to;
  const urlParams = new URLSearchParams(params);
  if (urlParams.toString().length > 0) {
    return `${path}?${urlParams.toString()}`;
  } else {
    return path;
  }
}

export const live_patch = (
  anchorBody: HtmlSafeString | string,
  options: LiveViewPatchHelperOptions
): HtmlSafeString => {
  // prettier-ignore
  return html`<a data-phx-link="patch" data-phx-link-state="push" href="${safe(buildHref(options))}"${options.className ? safe(` class="${options.className}"`) : ""}>${anchorBody}</a>`;
};
