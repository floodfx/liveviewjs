import { nanoid } from "nanoid";
import { UploadConfig } from ".";
import { PhxEventUpload } from "../socket/types";

export interface UploadEntry {
  cancelled: boolean;
  client_last_modified: number; // timestamp
  client_name: string; // original filename
  client_size: number; // bytes
  client_type: string; // mime type
  done: boolean; // true if the upload has been completed
  preflighted: boolean; // true if the upload has been preflighted,
  progress: number; // 0-100% or is it bytes?,
  ref: string; // order of upload
  upload_ref: string; // upload ref nanoid
  uuid: string; // uuid
  valid: boolean; // true if the upload has no errors valid
  errors: string[]; // errors
}

export class UploadEntry {
  // keep config private
  #config: UploadConfig;
  #tempFile: string;
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
    this.valid = this.errors.length === 0;
    this.#config = config;
    this.validate();
  }

  updateProgress(progress: number) {
    this.progress = progress;
    this.preflighted = progress > 0;
    this.done = progress === 100;
  }

  validate() {
    if (this.client_size > this.#config.maxFileSize) {
      this.errors.push("Too large");
    }
    // TODO map mime types to extensions so we can check for valid extensions
    // if (this.#config.accept.length > 0 && !this.#config.accept.includes(this.client_type)) {
    //   this.errors.push("Not allowed");
    // }
    this.valid = this.errors.length === 0;
  }

  setTempFile(tempFilePath: string) {
    this.#tempFile = tempFilePath;
  }

  getTempFile() {
    return this.#tempFile;
  }
}
