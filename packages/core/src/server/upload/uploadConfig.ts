export interface UploadEntry {
  cancelled: boolean;
  client_last_modified?: number; // timestamp
  client_name?: string; // original filename
  client_size?: number; // bytes
  client_type?: string; // mime type
  done?: boolean; // true if the upload has been completed
  preflighted?: boolean; // true if the upload has been preflighted,
  progress: number; // 0-100% or is it bytes?,
  ref: string; // order of upload
  upload_config?: UploadConfig; // upload config
  upload_ref: string; // upload ref nanoid
  uuid: string; // uuid
  valid: boolean; // true if the upload is valid
  errors?: string[]; // errors
}

export interface UploadConfig {
  name: string;
  accept: string[];
  maxEntries: number;
  maxFileSize: number;
  autoUpload: boolean;
  entries: UploadEntry[];
  ref: string;
  errors?: string[];
}
