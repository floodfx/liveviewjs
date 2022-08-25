/*
 * Welp there isn't a cross platform mime type library for both
 * nodejs and deno.  So instead we'll download the mime-db json from
 * the CDN and use that to map from mime-types to extensions.
 */
const MIME_DB_URL = "https://cdn.jsdelivr.net/gh/jshttp/mime-db@master/db.json";

export type MimeSource = "apache" | "iana" | "nginx";

interface MimeDB {
  [key: string]: {
    /**
     * Where the mime type is defined. If not set, it's probably a custom media type.
     */
    source?: string;
    /**
     * Known extensions associated with this mime type
     */
    extensions: string[];
    /**
     * Whether a file of this type can be gzipped.
     */
    compressible?: boolean;
    /**
     * The default charset associated with this type, if any.
     */
    charset?: string;
  };
}

let db: MimeDB;
let extensions: { [key: string]: string[] } = {};
let loaded = false;

/**
 * A class for looking up mime type extensions built on top of the mime-db.
 */
class Mime {
  constructor() {
    if (!loaded) {
      this.load();
    }
  }

  /**
   * Given a mime type, return the string[] of extensions associated with it.
   * @param mimeType the string mime type to lookup
   * @returns the string[] of extensions associated with the mime type or an empty array if none are found.
   */
  lookupExtensions(mimeType: string): string[] {
    return db[mimeType]?.extensions || [];
  }

  lookupMimeType(ext: string): string[] {
    return extensions[ext] || [];
  }

  async load() {
    if (loaded) return;
    loaded = true;
    try {
      const res = await fetch(MIME_DB_URL);
      if (!res.ok) {
        throw new Error(`Failed to load mime-db: ${res.status} ${res.statusText}`);
      }
      db = await res.json();

      // build a reverse lookup table for extensions to mime types
      Object.keys(db).forEach((mimeType, i) => {
        const exts = this.lookupExtensions(mimeType);
        exts.forEach((ext) => {
          if (!extensions[ext]) {
            extensions[ext] = [];
          }
          extensions[ext].push(mimeType);
        });
      });
    } catch (e) {
      console.error(e);
      loaded = false;
    }
  }
}

const mime = new Mime();

export { mime };
