import escapeHtml, { HtmlSafeString } from "..";

interface LiveViewPatchHelperOptions {
  to: {
    path: string,
    params: { [key: string]: string }
  },
  class?: string,
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

export const live_patch = (anchorBody: HtmlSafeString | string, options: LiveViewPatchHelperOptions): HtmlSafeString => {
  return escapeHtml`
    <a
      data-phx-link="patch"
      data-phx-link-state="push"
      href="${buildHref(options)}"
      ${options.class ? escapeHtml`class="${options.class}"` : ""}
    >
    ${anchorBody}
    </a>
  `
}