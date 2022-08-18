import { nanoid } from "nanoid";
import { UploadEntry } from ".";

export interface UploadConfig {
  name: string;
  accept: string[];
  maxEntries: number;
  maxFileSize: number;
  autoUpload: boolean;
  entries: UploadEntry[];
  ref: string;
  errors: string[];
}

export type UploadConfigOptions = {
  accept?: string[];
  maxEntries?: number;
  maxFileSize?: number;
  autoUpload?: boolean;
};

export class UploadConfig {
  constructor(name: string, options?: UploadConfigOptions) {
    this.name = name;
    this.accept = options?.accept ?? [];
    this.maxEntries = options?.maxEntries ?? 1;
    this.maxFileSize = options?.maxFileSize ?? 8 * 1024 * 1024; // 8MB
    this.autoUpload = options?.autoUpload ?? false;
    this.entries = [];
    this.ref = `phx-${nanoid()}`;
    this.errors = [];
  }

  addEntries(entries: UploadEntry[]) {
    this.entries = this.entries.concat(entries);
    this.validate();
  }

  removeEntry(ref: string) {
    const entryIndex = this.entries.findIndex((entry) => entry.ref === ref);
    if (entryIndex > -1) {
      this.entries.splice(entryIndex, 1);
    }
    this.validate();
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
