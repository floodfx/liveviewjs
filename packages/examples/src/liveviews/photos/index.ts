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
      max_entries: 3, // only 3 entries per upload
      max_file_size: 5 * 1024 * 1024, // 5MB
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
        // Yay! We've successfully saved the photo, so we can consume (i.e. "remove")
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
        const { ref } = event;
        // remove the uploaded entry from the upload config
        socket.cancelUpload("photos", ref);
        break;
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
            Add up to ${uploads.photos.max_entries} photos
            (max ${uploads.photos.max_file_size / (1024 * 1024)} MB each)
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
      <div style="width: 250px; margin: 2rem 0;">${live_img_preview(entry)}</div>
      <div style="display: flex; align-items: center; margin-left: 2rem;">
        <progress
          style="position: relative; top: 8px; width: 150px; height: 1em;"
          value="${entry.progress}"
          max="100"></progress>
        <span style="margin-left: 1rem;">${entry.progress}%</span>
      </div>
      <div style="display: flex; align-items: center;">
        <a style="padding-left: 2rem;" phx-click="cancel" phx-value-ref="${entry.ref}">🗑</a>
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
  const exts = mime.lookupExtensions(entry.type);
  const ext = exts.length > 0 ? exts[0] : "bin";
  return `${entry.uuid}.${ext}`;
}
