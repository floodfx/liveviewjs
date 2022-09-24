---
sidebar_position: 2
---

# Built-in Image Preview

LiveViewJS ships with build-in support for image previews when uploading files.

## Getting Entries from `meta.uploads`

The list of `UploadEntry` objects for a given upload config can be found in the `meta.uploads` object based on the name
you provided when configuring it using the `allowUpload` method. For example, if you configured an upload config named
`photos`, you can access the list of `UploadEntry` objects using `meta.uploads.photos`. Here is an example of accessing
the list of `UploadEntry` objects for a given upload config:

```ts
...
render: (context, meta) => {
  ...
  <div>
    ${meta.uploads.photos.map((entry) => {
      return html`
        <!-- render the entry -->
      `;
    })}
  </div>
  ...
}
```

## `live_img_preview` Tag

In order to use the built-in image preview, you must use the `live_img_preview` tag. This tag takes a `UploadEntry` and
renders an image preview of it.

```ts
...
render: (context, meta) => {
  ...
  <div>${live_img_preview(entry)}</div>
  ...
}
```

## All Together now

```ts
...
render: (context, meta) => {
  ...
  <div>
    ${meta.uploads.photos.map((entry) => {
      return html`
        <div>${live_img_preview(entry)}</div>
      `;
    })}
  </div>
  ...
}
```

That's it! 🤯

## Credit where credit is due

Thanks to the Phoenix LiveView folks that built this! 🙌 This is a great example of why we built on top of the existing
LiveView client-side JS.
