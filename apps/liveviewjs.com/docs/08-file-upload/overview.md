---
sidebar_position: 1
---

# Overview

File uploads are another common feature of web applications. **LiveViewJS** provides built in support for file uploads,
image previews, upload progress, drag and drop, error handling, and more. Handling file uploads can be intimidating, but
**LiveViewJS** makes it easy.

## Learn by Example

We're going to start with a complete example and then walk through the code. The example LiveView allows you to create a
new photo album with a name and up to 3 photos.

:::info This example is available as part of the `packages/examples` directory in the
[LiveViewJS repository](https://github.com/floodfx/liveviewjs) and runs on both the Express (NodeJS) and Oak (Deno)
servers. :::

## Example LiveView Code

```ts
import {
  createLiveView,
  error_tag,
  form_for,
  html,
  LiveViewChangeset,
  live_file_input,
  live_img_preview,
  mime,
  SingleProcessPubSub,
  submit,
  text_input,
  UploadEntry,
} from "liveviewjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { InMemoryChangesetDB } from "../../datastore/InMemory";

type PhotosContext = {
  photoGroups: PhotoGroup[];
  changeset: LiveViewChangeset<PhotoGroup>;
};

type PhotosEvents =
  | { type: "validate"; name: string }
  | { type: "save"; name: string; urls: string[] }
  | { type: "cancel"; config_name: string; ref: string };

export const photosLiveView = createLiveView<PhotosContext, PhotosEvents>({
  mount: async (socket) => {
    if (socket.connected) {
      // listen to photos topic
      await socket.subscribe(photoGroupTopic);
    }
    // setup the default context
    socket.assign({
      photoGroups: photoGroupStore.list(),
      changeset: photoGroupStore.changeset(),
    });
    // configure the upload constraints
    socket.allowUpload("photos", {
      accept: [".png", ".jpg", ".jpeg", ".gif"], // only allow images
      maxEntries: 3,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });
  },
  handleEvent: async (event, socket) => {
    switch (event.type) {
      case "validate": {
        // just validate the changeset
        socket.assign({ changeset: photoGroupStore.validate(event) });
        break;
      }
      case "save": {
        // first get the completed file uploads and map them to urls
        // Note: the files are guaranteed to be completed here because
        // save is the event called after all the uploads are complete
        const { completed } = await socket.uploadedEntries("photos");

        // set the urls on the event (which was not set via the form)
        event.urls = completed.map(filename);

        // attempt to save the photo
        const photoCreate = photoGroupStore.create(event);
        if (!photoCreate.valid) {
          // if the photo is not valid, assign the changeset and return
          // so that the form is re-rendered with the errors
          socket.assign({
            changeset: photoCreate,
          });
          return;
        }
        // Yay! We've successfully saved the photo, so we can consume (i.e.,  "remove")
        // the uploaded entries from the "photos" upload config
        await socket.consumeUploadedEntries("photos", async (meta, entry) => {
          // we could create thumbnails, scan for viruses, etc.
          // but for now move the data from the temp file (meta.path) to a public directory
          meta.fileSystem.createOrAppendFile(`./public/${filename(entry)}`, meta.path);
        });
        // update the context with new photos and clear the form
        socket.assign({
          photoGroups: photoGroupStore.list(),
          changeset: photoGroupStore.changeset(),
        });
        break;
      }
      case "cancel": {
        const { config_name, ref } = event;
        // remove the uploaded entry from the upload config
        socket.cancelUpload(config_name, ref);
      }
    }
  },
  // Handle broadcast events from the pub/sub subscription for the "photoGroup" topic
  handleInfo: (info, socket) => {
    const { data } = info;
    socket.assign({
      photoGroups: [data],
      changeset: photoGroupStore.changeset(),
    });
  },
  // Render the view
  render: (ctx, meta) => {
    const { photoGroups, changeset } = ctx;
    const { uploads } = meta;
    return html`
      <h2>My Photo Groups</h2>

      <!-- Render the form -->
      ${form_for<PhotoGroup>("#", meta.csrfToken, {
        id: "photo-form",
        phx_change: "validate",
        phx_submit: "save",
      })}
        <!-- photo group name input -->
        <div>
          Photo Group Name:
          ${text_input<PhotoGroup>(changeset, "name")}
          ${error_tag<PhotoGroup>(changeset, "name")}
        </div>

        <div>
          <!-- file input / drag and drop -->
          <div phx-drop-target="${uploads.photos.ref}" style="border: 2px dashed #ccc; padding: 10px; margin: 10px 0;">
            ${live_file_input(uploads.photos)}
            or drag and drop files here
          </div>
          <!-- help text -->
          <div style="font-size: 10px; padding-bottom: 3rem">
            Add up to ${uploads.photos.maxEntries} photos
            (max ${uploads.photos.maxFileSize / (1024 * 1024)} MB each)
          </div>
        </div>

        <!-- any errors from the upload -->
        ${uploads.photos.errors?.map((error) => html`<p class="invalid-feedback">${error}</p>`)}

        <!-- render the preview, progress, and cancel button of the selected files -->
        ${uploads.photos.entries.map(renderEntry)}

        <!-- submit button -->
        ${submit("Upload", { phx_disable_with: "Saving...", disabled: uploads.photos.errors.length > 0 })}
      </form>

      <!-- render the photo groups -->
      <ul id="photo_groups_list" phx-update="prepend">
        ${photoGroups.map(renderPhotoGroup)}
      </ul>
    `;
  },
});

// Render a preview of the uploaded file with progress bar and cancel button
function renderEntry(entry: UploadEntry) {
  return html`
    <div style="display: flex; align-items: center;">
      <div style="width: 250px; border: 1px solid black; margin: 2rem 0;">${live_img_preview(entry)}</div>
      <div style="display: flex; align-items: center; margin-left: 2rem;">
        <progress
          style="position: relative; top: 8px; width: 150px; height: 1em;"
          value="${entry.progress}"
          max="100"></progress>
        <span style="margin-left: 1rem;">${entry.progress}%</span>
      </div>
      <div style="display: flex; align-items: center;">
        <a style="padding-left: 2rem;" phx-click="cancel" phx-value-config_name="photos" phx-value-ref="${entry.ref}"
          >🗑</a
        >
        ${entry.errors?.map((error) => html`<p style="padding-left: 1rem;" class="invalid-feedback">${error}</p>`)}
      </div>
    </div>
  `;
}

// Render a photo group with a list of photos
function renderPhotoGroup(photoGroup: PhotoGroup) {
  return html`<li id="${photoGroup.id}">
    ${photoGroup.urls.map(
      (url, i) => html`
        <h3>${photoGroup.name}(${i + 1})</h3>
        <img src="${url}" />
      `
    )}
  </li>`;
}

// Define the shape of the Photo type
const PhotoGroupSchema = z.object({
  id: z.string().default(nanoid),
  name: z.string().min(1).max(100),
  urls: z.array(z.string()).min(1).default([]),
});

// Infer the type from the schema
type PhotoGroup = z.infer<typeof PhotoGroupSchema>;

// Pubsub topic for photos
const photoGroupTopic = "photoGroup";

// InMemory DB for photoGroup that publishes changes to the "photos" topic
const photoGroupStore = new InMemoryChangesetDB<PhotoGroup>(PhotoGroupSchema, {
  pubSub: new SingleProcessPubSub(),
  pubSubTopic: photoGroupTopic,
});

/**
 * `filename` maps the upload entry to a filename based on the mime type of the entry
 * concatenated with the entry's uuid
 */
function filename(entry: UploadEntry) {
  const exts = mime.lookupExtensions(entry.client_type);
  const ext = exts.length > 0 ? exts[0] : "bin";
  return `${entry.uuid}.${ext}`;
}
```

Let's review each part in more detail to understand what's going on.

## Configure the upload

First, we need to tell LiveView that we want to upload files and we use the `socket.allowUpload` method in `mount` to do
so:

```ts
mount: (socket) => {
...
  // configure the upload constraints
  socket.allowUpload("photos", {
    accept: [".png", ".jpg", ".jpeg", ".gif"], // only allow images
    maxEntries: 3,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });
...
}
```

The `allowUpload` method takes a `config_name` and an `UploadConfig` object. The `config_name` is used to identify the
upload config elsewhere in the LiveView lifecycle methods. More details on [config options](upload-config-options).

## User Interface

There is a lot going on in our LiveView's `render` function so let's walk through that.

### Setup the Form

As usual, we start by rendering the form with the `form_for` helper and set the `phx-change` and `phx-submit` events to
`validate` and `save` respectively.

```ts
...
${form_for<PhotoGroup>("#", meta.csrfToken, {
    id: "photo-form",
    phx_change: "validate",
    phx_submit: "save",
  })}
...
```

We will look at the `handleEvent` method later to see how especially the `save` event is handled.

### File Input and Drag and Drop

Next, we need a place for the user to choose files for upload. We use the `live_file_input` helper to render the file
input and the `phx-drop-target` attribute to make the element a drop target for files. The `phx-drop-target` attribute
takes a `ref` which is used to identify the upload config in the LiveView lifecycle methods. You'll notice we are
referencing the `uploads.photos` config we configured in `mount` earlier.

```ts
...
<!-- file input / drag and drop -->
<div phx-drop-target="${uploads.photos.ref}" style="border: 2px dashed #ccc; padding: 10px; margin: 10px 0;">
  ${live_file_input(uploads.photos)}
  or drag and drop files here
</div>
...
```

:::info 🤯 We just added a drag and drop target to our user interface with a single attribute (i.e.
`phx-drop-target="${uploads.photos.ref}"`)! Pretty cool, right!? Thanks Phoenix LiveView team!! 🙌 :::

:::caution The `live_file_input` helper goes beyond just rendering the file input, it also adds some required attributes
to the file input and works with the rest of **LiveViewJS** to handle uploads. You should always use it rather than
rendering the file input yourself. :::

### Dynamic Help Text

A very nice aspect of having the upload config available in `render` is it allows us to dynamically render help text
based on the upload config:

```ts
...
Add up to ${uploads.photos.maxEntries} photos
(max ${uploads.photos.maxFileSize / (1024 * 1024)} MB each)
...
```

### Show preview, progress, and cancel for entries

When a user selects (or drags and drops) files for upload, the `meta.uploads` object is automatically updated with those
entries (and any errors for the upload or entries). We can use the `upload.entries` (and `upload.errors`) to show the
user what will be uploaded or what errors in their selections.

```ts
...
<!-- render the preview, progress, and cancel button of the selected files -->
${uploads.photos.entries.map(renderEntry)}
...
```

The `renderEntry` function shows the image preview using `live_img_preview` and the progress of the upload using a
`progress` element. We also render a cancel button using the `phx-click` event to cancel the upload.

:::info 🤯 Since we are allowing images only, we can use the `live_img_preview` helper to render a preview of the image
before it is uploaded. Again, pretty amazing that we get an image preview for free! Thanks Phoenix LiveView team!! 🙌
:::

### Show errors as well

We configured the file uploads to only allow certain image file types, limited the number of files to 3, and limited the
file size to 10MB. If the user selects files that don't meet these constraints, the `uploads` object will be updated
with the errors for the given config. We can use the `upload.photos.errors` to show the user what errors they have made
for the upload config and `entry.errors` to show the errors for a given entry.

```ts
...
<!-- render the errors for the upload config -->
${uploads.photos.errors?.map((error) => html`<p class="invalid-feedback">${error}</p>`)}
...
```

```ts
...
<!-- render the errors for the entry -->
${entry.errors?.map((error) => html`<p class="invalid-feedback">${error}</p>`)}
...
```

Whew, we've got some pretty amazing functionality in our UI and we haven't even uploaded any files yet! Let's look at
the LiveView lifecycle methods to see how we handle the uploads.

## `handleEvent` Cases

`handleEvent` has two main events that it is handling for us: `cancel`, and `save`. Let's look at each of these in turn.

### `cancel` event

A user may want to remove an entry from the setup of files they have selected. Perhaps the file is too large or the
wrong type or they've simply changed their mind. Our `renderEntry` function renders a cancel button next to each entry
that fires off the `cancel` event enabling the user to remove the entry from the upload.

```ts
...
handleEvent: (event, socket) => {
  ...
  case "cancel": {
    const { ref } = event;
    // remove the entry from the upload config
    socket.cancelUpload("photos", ref);
    break;
  }
  ...
}
...
```

:::note A user can cancel an upload anytime before the `socket.consumeUploadedEntries` method is called. :::

### `save` event

The `save` event is automatically fired when the user submits the form. In the case of file uploads, this event is not
sent to the `handleEvent` method until after all the files have been fully uploaded.

:::info The upload progress for each entry will automatically be updated and the `render` method will be executed as
they are uploaded allowing us to show the user the progress of the upload. :::

Let's look at the `save` event handler:

```ts
...
handleEvent: (event, socket) => {
  ...
  case "save": {
    // first get the completed file uploads and map them to urls
    // Note: the files are guaranteed to be completed here because
    // save is the event called after all the uploads are complete
    const { completed } = await socket.uploadedEntries("photos");

    // set the urls on the event (which was not set via the form)
    event.urls = completed.map(filename);

    // attempt to save the photo
    const photoCreate = photoGroupStore.create(event);
    if (!photoCreate.valid) {
      // if the photo is not valid, assign the changeset and return
      // so that the form is re-rendered with the errors
      socket.assign({
        changeset: photoCreate,
      });
      return;
    }
    // Yay! We've successfully saved the photo, so we can consume (i.e.,  "remove")
    // the uploaded entries from the "photos" upload config
    await socket.consumeUploadedEntries("photos", async (meta, entry) => {
      // we could create thumbnails, scan for viruses, etc.
      // but for now move the data from the temp file (meta.path) to a public directory
      meta.fileSystem.createOrAppendFile(`./public/${filename(entry)}`, meta.path);
    });
    // update the context with new photos and clear the form
    socket.assign({
      photoGroups: photoGroupStore.list(),
      changeset: photoGroupStore.changeset(),
    });
    break;
  }
  ...
}
```

It's pretty well commented but to summarize:

1. We get the completed uploads from the `photos` upload config. (Note: the files are guaranteed to be completed here
   because `save` is the event called only after all the uploads are complete).
2. We map each entry to a url and add the `urls` to the `event` (which will become the `photoGroup`).
3. We attempt to save the `photoGroup` and check if the changeset is valid. If not, we return here to show the errors
   rather than `consumeUploadedEntries`.
4. If the changeset is valid, we `consumeUploadedEntries` which will move the files from the temp directory to the
   public directory and importantly, remove these files from the upload config.
5. Finally, We update the `context` and clear the form.

## Conclusion

Thanks for sticking with us through that. It was long and detailed and hopefully it was helpful. We think **LiveViewJS**
provides some pretty amazing out of the box support for file uploads.
