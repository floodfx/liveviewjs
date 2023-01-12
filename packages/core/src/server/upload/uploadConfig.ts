import { nanoid } from "nanoid";
import { UploadEntry } from ".";

/**
 * UploadConfig contains configuration and entry related details for uploading files.
 */
export interface UploadConfig {
  /**
   * The name of the upload config to be used in the `allowUpload` and `uploadedEntries` methods.
   * should be unique per LiveView.
   */
  name: string;
  /**
   * "accept" contains the unique file type specifiers that can be uploaded.
   * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers
   */
  accept: string[];
  /**
   * the maximum number of files that can be uploaded at once. Defaults to 1.
   */
  max_entries: number;
  /**
   * the maximum size of each file in bytes. Defaults to 10MB.
   */
  max_file_size: number;
  /**
   * Whether to upload the selected files automatically when the user selects them.
   * Defaults to false.
   */
  auto_upload: boolean;
  /**
   * The size of each chunk in bytes. Defaults to 64kb.
   */
  chunk_size: number;
  /**
   * The files selected for upload.
   */
  entries: UploadEntry[];
  /**
   * The unique instance ref of the upload config
   */
  ref: string;
  /**
   * Errors that have occurred during selection or upload.
   */
  errors: string[];
}

/**
 * Options for creating a new upload config.
 */
export type UploadConfigOptions = {
  /**
   * "accept" contains the unique file type specifiers that can be uploaded.
   * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers
   * An empty array will allow all file types.
   */
  accept?: string[];
  /**
   * the maximum number of files that can be uploaded at once. Defaults to 1.
   */
  max_entries?: number;
  /**
   * the maximum size of each file in bytes. Defaults to 10MB.
   */
  max_file_size?: number;
  /**
   * Whether to upload the selected files automatically when the user selects them.
   * Defaults to false.
   */
  auto_upload?: boolean;
  /**
   * The size of each chunk in bytes. Defaults to 64kb.
   */
  chunk_size?: number;
};

/**
 * UploadConfig contains configuration and entry related details for uploading files.
 */
export class UploadConfig implements UploadConfig {
  constructor(name: string, options?: UploadConfigOptions) {
    this.name = name;
    this.accept = options?.accept ?? [];
    this.max_entries = options?.max_entries ?? 1;
    this.max_file_size = options?.max_file_size ?? 10 * 1024 * 1024; // 10MB
    this.auto_upload = options?.auto_upload ?? false;
    this.chunk_size = options?.chunk_size ?? 64 * 1024; // 64kb
    this.entries = [];
    this.ref = `phx-${nanoid()}`;
    this.errors = [];
  }

  /**
   * Set the entries for the config.
   * @param entries UploadEntry[] to set
   */
  setEntries(entries: UploadEntry[]) {
    this.entries = [...entries];
    this.validate();
  }

  /**
   * Remove an entry from the config.
   * @param ref The unique ref of the UploadEntry to remove.
   */
  removeEntry(ref: string) {
    const entryIndex = this.entries.findIndex((entry) => entry.ref === ref);
    if (entryIndex > -1) {
      this.entries.splice(entryIndex, 1);
    }
    this.validate();
  }

  /**
   * Returns all the entries (throws if any are still uploading) and removes
   * the entries from the config.
   */
  consumeEntries() {
    const entries = [...this.entries];
    this.entries = [];
    this.validate();
    return entries;
  }

  /**
   * Checks if the entries are valid w.r.t. max_entries, max_file_size, and mime type.
   */
  private validate() {
    this.errors = [];
    if (this.entries.length > this.max_entries) {
      this.errors.push("Too many files");
    }
    // add errors from entries
    this.entries.forEach((entry) => {
      if (!entry.valid) {
        this.errors.push(...entry.errors);
      }
    });
  }
}
