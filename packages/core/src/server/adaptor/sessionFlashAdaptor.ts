import { SessionData } from "../session";
import { FlashAdaptor } from "./flash";

/**
 * Naive implementation of flash adaptor that uses "__flash" property on session data
 * to implement flash.
 */
export class SessionFlashAdaptor implements FlashAdaptor {
  peekFlash(session: SessionData, key: string): Promise<string | undefined> {
    if (!session.__flash) {
      // istanbul ignore next
      session.__flash = {};
    }
    return Promise.resolve(session.__flash[key]);
  }

  popFlash(session: SessionData, key: string): Promise<string | undefined> {
    // istanbul ignore next
    if (session.__flash === undefined) {
      // istanbul ignore next
      session.__flash = {};
    }
    const value = session.__flash[key];
    delete session.__flash[key];
    return Promise.resolve(value);
  }

  putFlash(session: SessionData, key: string, value: string): Promise<void> {
    if (!session.__flash) {
      // istanbul ignore next
      session.__flash = {};
    }
    session.__flash[key] = value;
    return Promise.resolve();
  }

  clearFlash(session: SessionData, key: string): Promise<void> {
    // istanbul ignore next
    if (session.__flash === undefined) {
      // istanbul ignore next
      session.__flash = {};
    }
    delete session.__flash[key];
    return Promise.resolve();
  }
}
