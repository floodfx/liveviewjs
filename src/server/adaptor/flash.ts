import { SessionData } from "../session";

/**
 * Adatpor that implements adding flash to the session data and removing flash from the session data.
 */
export interface FlashAdaptor {
  putFlash(session: SessionData, key: string, value: string): Promise<void>;
  clearFlash(session: SessionData, key: string): Promise<void>;
}
