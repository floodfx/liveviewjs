import { Flash } from "../../live/flash";
import { html, HtmlSafeString } from "../htmlSafeString";

export const live_flash = (flash: Flash | undefined, flashKey: string): HtmlSafeString => {
  if (!flash) {
    return html``;
  }

  return html`${flash.getFlash(flashKey) ?? ""}`;
};
