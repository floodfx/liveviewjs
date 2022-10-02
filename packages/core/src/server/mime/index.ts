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

/**
 * A class for looking up mime type extensions built on top of the mime-db.
 */
class Mime {
  db: MimeDB;
  extensions: { [key: string]: string[] } = {};
  #loaded: boolean = false;
  constructor() {
    this.load();
  }

  /**
   * Given a mime type, return the string[] of extensions associated with it.
   * @param mimeType the string mime type to lookup
   * @returns the string[] of extensions associated with the mime type or an empty array if none are found.
   */
  lookupExtensions(mimeType: string): string[] {
    return this.db[mimeType]?.extensions || [];
  }

  /**
   * Given an extension (without the leading dot), return the string[] of mime types associated with it.
   * @param ext the extension (without leading dot) to lookup
   * @returns the string[] of mime types associated with the extension or an empty array if none are found.
   */
  lookupMimeType(ext: string): string[] {
    return this.extensions[ext] || [];
  }

  get loaded() {
    return this.#loaded;
  }

  async load() {
    if (this.loaded) return;
    try {
      if (globalThis && !globalThis.fetch) {
        // only Node 18+ and Deno have fetch so fall back to https
        //  implementation if globalThis.fetch is not defined.
        this.db = await nodeHttpFetch<MimeDB>(MIME_DB_URL);
      } else {
        const res = await fetch(MIME_DB_URL);
        // istanbul ignore next
        if (!res.ok) {
          // istanbul ignore next
          throw new Error(`Failed to load mime-db: ${res.status} ${res.statusText}`);
        }
        this.db = await res.json();
      }

      // build a reverse lookup table for extensions to mime types
      Object.keys(this.db).forEach((mimeType, i) => {
        const exts = this.lookupExtensions(mimeType);
        exts.forEach((ext) => {
          if (!this.extensions[ext]) {
            this.extensions[ext] = [];
          }
          this.extensions[ext].push(mimeType);
        });
      });
      this.#loaded = true;
    } catch (e) {
      // istanbul ignore next
      console.error(e);
      // istanbul ignore next
      this.#loaded = false;
    }
  }
}

/**
 * Fallback implementation of getting JSON from a URL for Node <18.
 * @param url the url to fetch
 * @returns the JSON object returned from the URL
 */
export function nodeHttpFetch<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const https = require("https");

    https.get(url, (res: any) => {
      if (res.statusCode !== 200) {
        res.resume(); // ignore response body
        reject(res.statusCode);
      }

      let data = "";
      res.on("data", (chunk: any) => {
        data += chunk;
      });

      res.on("close", () => {
        resolve(JSON.parse(data) as T);
      });
    });
  });
}

const mime = new Mime();

export { mime };
