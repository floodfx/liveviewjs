import { html } from ".."

interface FormForOptions {
  phx_submit?: string
  phx_change?: string
  method?: "get" | "post"
}

// TODO insert hidden input for CSRF token?
export const form_for = <T>(action: string, options?: FormForOptions) => {
  const method = options?.method ?? "post";
  const phx_submit = options?.phx_submit ? ` phx-submit="${options.phx_submit}"` : "";
  const phx_change = options?.phx_change ? ` phx-change="${options.phx_change}"` : "";
  return `<form action="${action}" method="${method}"${phx_submit}${phx_change}>`
}