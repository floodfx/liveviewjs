---
sidebar_position: 5
---

# LiveViewSocket API - Uploads

A common use case for a web application is to allow users to upload files. The following methods on the `LiveViewSocket`
enable you to upload files to your server.

## LiveViewSocket Properties and Methods

| Name                                                                                                                                   | Description                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `allowUpload(name: string, options?: UploadConfigOptions): Promise<void>;`                                                             | Allows file uploads for the given LiveView and configures the upload options (filetypes, size, etc).                                                                                                                                                                                             |
| `cancelUpload(configName: string, ref: string): Promise<void>;`                                                                        | Cancels the file upload for a given UploadConfig by config name and file ref.                                                                                                                                                                                                                    |
| `consumeUploadedEntries<T>(configName: string,fn: (meta: ConsumeUploadedEntriesMeta, entry: UploadEntry) => Promise<T>):Promise<T[]>;` | Consume the uploaded files for a given UploadConfig (by name). This should only be called after the form's "save" event has occurred which guarantees all the files for the upload have been fully uploaded.                                                                                     |
| `uploadedEntries(configName: string): Promise<{completed: UploadEntry[];inProgress: UploadEntry[];}>;`                                 | Returns two sets of files that are being uploaded, those `completed` and those `inProgress` for a given UploadConfig (by name). Unlike `consumeUploadedEntries`, this does not require the form's "save" event to have occurred and will not throw if any of the entries are not fully uploaded. |

## `allowUpload` Method

`allowUpload` is used to configure the file upload options for a given LiveView. This method should be called in the
`mount` method of your LiveView. The `options` parameter is optional and if not provided, the default options will be
used. `allowUpload` requires a `name` parameter which is used to identify the upload config elsewhere in your code. Here
is an example of configuring the upload options for a LiveView using `allowUpload`:

```ts
...
mount: (socket) => {
  ...
  // configure the upload constraints
  socket.allowUpload("photos", {
    accept: [".png", ".jpg", ".jpeg", ".gif"], // only allow images
    maxEntries: 3, // only allow 3 files to be uploaded
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });
  ...
}
...
```

Now that you've configured the upload options, you can use those options to render a `live_file_input` tag that allows
the user to upload files. Here is an example of a `live_file_input` tag that uses the `photos` upload config as part of
your `render` template:

```html
<!-- use the "photos" upload config -->
<div>${live_file_input(uploads.photos)}</div>
```

## `cancelUpload` Method

`cancelUpload` is a way to remove a file from the set of entries that either are ready to be uploaded or have already
been uploaded (but not fully consumed yet). Typically, you would call this method in response to a user action such as
clicking a "remove" button next to a file. Here is an example of calling `cancelUpload` in response to a user action:

```ts
handleEvent: (socket, event) => {
  ...
  switch (event.type) {
    ...
    case "cancel":
      const { config_name, ref } = event;
      // remove the uploaded entry from the upload config
      socket.cancelUpload(config_name, ref);
      break;
    ...
  }
  ...
}
...
render: (context, meta) {
  ...
  <a phx-click="cancel" phx-value-config_name="photos" phx-value-ref="${entry.ref}">🗑</a>
  ...
}
...
```

## `consumeUploadedEntries` Method

`consumeUploadedEntries` is a way to fully process the uploaded files for a given `UploadConfig` (by name). **This
should only be called after the form's "save" event has occurred which guarantees all the files for the upload have been
fully uploaded**. Here is an example of calling `consumeUploadedEntries` after the form's "save" event has occurred:

```ts
...
handleEvent: (socket, event) => {
  ...
  switch (event.type) {
    ...
    case "save":
      ...
      // consume the uploaded entries for the "photos" upload config
      await socket.consumeUploadedEntries("photos", async (meta, entry) => {
        // we could create thumbnails, scan for viruses, etc.
        // but for now move the data from the temp file (meta.path) to a public directory
        meta.fileSystem.createOrAppendFile(`./public/${filename(entry)}`, meta.path);
      });
      ...
      break;
    ...
  }
  ...
}
...
```

## `uploadedEntries` Method

`uploadedEntries` returns the set of files that are either in progress of being uploaded or have already been uploaded
(but not fully consumed yet). Unlike `consumeUploadedEntries` this can be called before the form's save event has
occured.

```ts
...
// get the complete and in progress entries for the "photos" upload config
const { completed, inProgress } = await socket.uploadedEntries("photos");
// do something with the entries
...
```

## More details

More details on file uploads can be found in the [File Uploads](/docs/file-upload/overview) section of the docs.
