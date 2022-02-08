import html from ".."

interface SubmitOptions {
  phx_disable_with: string
}

export const submit = (label: string, options?: SubmitOptions) => {
  const phx_disable_with = options?.phx_disable_with ?? "";
  return html`
    <button ${phx_disable_with} type="submit">${label}</button>
  `
}