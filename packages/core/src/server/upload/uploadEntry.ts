import { nanoid } from "nanoid";
import { UploadConfig } from ".";
import { mime } from "../mime";
import { PhxEventUpload } from "../socket/types";

/**
 * A file and related metadata selected for upload
 */
export interface UploadEntry {
  /**
   * Whether the file selection has been cancelled. Defaults to false.
   */
  cancelled: boolean;
  /**
   * The timestamp when the file was last modified from the client's file system
   */
  client_last_modified: number;
  /**
   * The name of the file from the client's file system
   */
  client_name: string;
  /**
   * The size of the file in bytes from the client's file system
   */
  client_size: number;
  /**
   * The mime type of the file from the client's file system
   */
  client_type: string;
  /**
   * True if the file has been uploaded. Defaults to false.
   */
  done: boolean;
  /**
   * True if the file has been auto-uploaded. Defaults to false.
   */
  preflighted: boolean;
  /**
   * The integer percentage of the file that has been uploaded. Defaults to 0.
   */
  progress: number;
  /**
   * The unique instance ref of the upload entry
   */
  ref: string;
  /**
   * The unique instance ref of the upload config to which this entry belongs
   */
  upload_ref: string;
  /**
   * A uuid for the file
   */
  uuid: string;
  /**
   * True if there are no errors with the file. Defaults to true.
   */
  valid: boolean;
  /**
   * Errors that have occurred during selection or upload.
   */
  errors: string[];
}

export class UploadEntry {
  // private fields
  #config: UploadConfig; // the parent upload config
  #tempFile: string; // the temp file location where the file is stored

  constructor(upload: PhxEventUpload, config: UploadConfig) {
    this.cancelled = false;
    this.client_last_modified = upload.last_modified;
    this.client_name = upload.name;
    this.client_size = upload.size;
    this.client_type = upload.type;
    this.done = false;
    this.preflighted = false;
    this.progress = 0;
    this.ref = upload.ref;
    this.upload_ref = config.ref;
    this.uuid = nanoid();
    this.errors = [];
    this.valid = true;
    this.#config = config;
    this.validate();
  }

  updateProgress(progress: number) {
    this.progress = progress;
    this.preflighted = progress > 0;
    this.done = progress === 100;
  }

  validate() {
    this.errors = [];

    // validate file size
    if (this.client_size > this.#config.maxFileSize) {
      this.errors.push("Too large");
    }

    // validate mime type is allowed
    if (this.#config.accept.length > 0) {
      // client type is a mime type but accept list can be either a mime type or extension
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers
      let allowed = false;
      for (let i = 0; i < this.#config.accept.length; i++) {
        const acceptItem = this.#config.accept[i];
        if (acceptItem.startsWith(".")) {
          // extension so look up mime type (first trim off the leading dot)
          const mimeTypes = mime.lookupMimeType(acceptItem.slice(1));
          if (mimeTypes.includes(this.client_type)) {
            allowed = true;
            break;
          }
        } else {
          // mime type so check if it matches
          if (acceptItem === this.client_type) {
            allowed = true;
            break;
          }
        }
      }
      if (!allowed) {
        this.errors.push("Not allowed");
      }
    }
    this.valid = this.errors.length === 0;
  }

  setTempFile(tempFilePath: string) {
    this.#tempFile = tempFilePath;
  }

  getTempFile() {
    return this.#tempFile;
  }
}
