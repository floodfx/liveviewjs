---
sidebar_position: 4
---

# Upload Config Options

These are the options you can pass into the `allowUpload` method to configure the upload.

- `accept`: an array of strings that represent the file extensions and/or mime types that are allowed to be uploaded.
  For example, `[".png", ".jpg", ".jpeg", ".gif"]` will only allow images to be uploaded. See
  [unique file type specifiers](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers)
  for more information. Defaults to `[]` (no restrictions)
- `maxEntries`: the maximum number of files that can be uploaded. If the user tries to upload more than this number of
  files, an error will be present in the upload config. Defaults to `1`.
- `maxFileSize`: the maximum file size (in bytes) that can be uploaded. If the user tries to upload a file that is
  larger than this number, an error will be present in the upload config. Defaults to `10 * 1024 * 1024` (10MB).
- `autoUpload`: if `true`, the file will be uploaded as soon as it is selected by the user. If `false`, the file will
  not be uploaded until the user initiates the form's save event. The default is `false`.
