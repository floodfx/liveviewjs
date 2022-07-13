import { SessionData } from "../session";

/**
 * Adatpor that implements adding flash to the session data and removing flash from the session data.
 */
export interface FlashAdaptor {
  peekFlash(session: SessionData, key: string): Promise<string | undefined>;
  popFlash(session: SessionData, key: string): Promise<string | undefined>;
  putFlash(session: SessionData, key: string, value: string): Promise<void>;
  clearFlash(session: SessionData, key: string): Promise<void>;
}
