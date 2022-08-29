import { nanoid } from "nanoid";
import { UploadEntry } from ".";

/**
 * The configuration and entry related details for uploading files.
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
  maxEntries: number;
  /**
   * the maximum size of each file in bytes. Defaults to 10MB.
   */
  maxFileSize: number;
  /**
   * Whether to upload the selected files automatically when the user selects them.
   * Defaults to false.
   */
  autoUpload: boolean;
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
   */
  accept?: string[];
  /**
   * the maximum number of files that can be uploaded at once. Defaults to 1.
   */
  maxEntries?: number;
  /**
   * the maximum size of each file in bytes. Defaults to 10MB.
   */
  maxFileSize?: number;
  /**
   * Whether to upload the selected files automatically when the user selects them.
   * Defaults to false.
   */
  autoUpload?: boolean;
};

export class UploadConfig implements UploadConfig {
  constructor(name: string, options?: UploadConfigOptions) {
    this.name = name;
    this.accept = options?.accept ?? [];
    this.maxEntries = options?.maxEntries ?? 1;
    this.maxFileSize = options?.maxFileSize ?? 10 * 1024 * 1024; // 8MB
    this.autoUpload = options?.autoUpload ?? false;
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

  private validate() {
    this.errors = [];
    if (this.entries.length > this.maxEntries) {
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
