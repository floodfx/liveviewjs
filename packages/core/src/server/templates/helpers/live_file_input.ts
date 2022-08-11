import { UploadConfig } from "../../upload/uploadConfig";
import { html, HtmlSafeString } from "../htmlSafeString";

export function live_file_input(uploadConfig: UploadConfig): HtmlSafeString {
  const { name, accept, maxEntries, ref, entries } = uploadConfig;
  const multiple = maxEntries > 1 ? "multiple" : "";
  const activeRefs = entries
    .filter((entry) => !entry?.done ?? false)
    .map((entry) => entry.ref)
    .join(",");
  const doneRefs = entries
    .filter((entry) => entry?.done ?? false)
    .map((entry) => entry.ref)
    .join(",");
  const preflightedRefs = entries
    .filter((entry) => entry?.preflighted ?? false)
    .map((entry) => entry.ref)
    .join(",");
  return html`
    <input
      id="${ref}"
      type="file"
      name="${name}"
      accept="${accept.join(",")}"
      ${multiple}
      data-phx-active-refs="${activeRefs}"
      data-phx-done-refs="${doneRefs}"
      data-phx-preflighted-refs="${preflightedRefs}"
      data-phx-update="ignore"
      data-phx-upload-ref="${ref}"
      phx-hook="Phoenix.LiveFileUpload" />
  `;
}
