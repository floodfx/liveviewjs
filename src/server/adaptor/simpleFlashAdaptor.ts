import { SessionData } from "../session";
import { FlashAdaptor } from "./flash";

/**
 * Naive implementation of flash adaptor that just adds flash to the session data and removes flash from the session data.
 */
export class SimpleFlashAdaptor implements FlashAdaptor {
  putFlash(session: SessionData, key: string, value: string): Promise<void> {
    if (!session.flash) {
      // istanbul ignore next
      session.flash = {};
    }
    session.flash[key] = value;
    return Promise.resolve();
  }

  clearFlash(session: SessionData, key: string): Promise<void> {
    if (!session.flash) {
      // istanbul ignore next
      session.flash = {};
    }
    delete session.flash[key];
    return Promise.resolve();
  }
}
