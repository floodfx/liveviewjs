import html from ".."

interface FormForOptions {
  phx_submit?: string
  method?: "get" | "post"
}

// TODO insert hidden input for CSRF token?
export const form_for = <T>(action: string, options?: FormForOptions) => {
  const method = options?.method ?? "post";
  const phx_submit = options?.phx_submit ? `phx-submit="${options.phx_submit}"` : "";
  return html`
    <form action="${action}" method="${method}" ${phx_submit}>
  `
}