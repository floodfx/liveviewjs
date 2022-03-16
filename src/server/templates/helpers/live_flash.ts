import { html, HtmlSafeString } from "..";
import { Flash } from "../../component/flash";

export const live_flash = (flash: Flash | undefined, flashKey: string): HtmlSafeString => {
  if (!flash) {
    return html``;
  }

  return html`${flash.getFlash(flashKey) ?? ""}`;
};
