import fs from "fs";
import {
  createLiveView,
  error_tag,
  form_for,
  html,
  LiveViewChangeset,
  live_file_input,
  live_img_preview,
  submit,
  text_input,
} from "liveviewjs";
import path from "path";
import { changeset, Photo } from "./data";

type Context = {
  photos: Photo[];
  changeset: LiveViewChangeset<Photo>;
};

type Events =
  | { type: "validate"; name: string }
  | { type: "save"; name: string; photoUrls: string[] }
  | { type: "cancel"; config_name: string; ref: string };

export const photos = createLiveView<Context, Events>({
  mount: (socket) => {
    socket.assign({
      photos: [],
      changeset: changeset({}, {}),
    });
    socket.allowUpload("photos", {
      accept: [".png", ".jpg", ".jpeg", ".pdf"],
      maxEntries: 3,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });
  },
  handleEvent: async (event, socket) => {
    console.log("handleEvent", event);
    switch (event.type) {
      case "validate": {
        const photoChangeset = changeset({}, event, "validate");
        console.log("validate", event, photoChangeset);
        socket.assign({ changeset: photoChangeset });
        break;
      }
      case "save": {
        const urls = await socket.consumeUploadedEntries("photos", async (meta, entry) => {
          console.log("save", meta, entry);
          // copy photos to public folder to serve them
          const dest = `${path.join(__dirname, "..")}/public/${entry.uuid}`;
          console.log("dest", dest);
          fs.copyFileSync(meta.path, dest);
          return dest;
        });
        console.log("urls", urls);
        event.photoUrls = urls;
        const photoChangeset = changeset({}, event, "validate");
        if (photoChangeset.valid) {
          console.log("saving photo", photoChangeset.data);
          socket.assign({
            changeset: changeset({}, {}),
          });
        } else {
          console.log("invalid photo");
          socket.assign({
            changeset: photoChangeset,
          });
        }
        break;
      }
      case "cancel": {
        const { config_name, ref } = event;
        socket.cancelUpload(config_name, ref);
      }
    }
  },
  render: (ctx, meta) => {
    const { photos, changeset } = ctx;
    const { uploads } = meta;
    return html`
      <h2>My Photos</h2>
      ${form_for<Photo>("#", meta.csrfToken, {
        id: "photo-form",
        phx_change: "validate",
        phx_submit: "save",
      })}
        ${text_input<Photo>(changeset, "name")}
        ${error_tag<Photo>(changeset, "name")}
        
        <div phx-drop-target="${uploads.photos.ref}" style="border: 2px dashed #ccc; padding: 10px; margin: 10px 0;">
          ${live_file_input(uploads.photos)}
          or drag and drop files here
        </div>
        ${uploads.photos.errors?.map((error) => html`<p>${error}</p>`)}
        
        ${uploads.photos.entries.map((entry) => {
          return html`
            <div>
              <div style="width: 150px; border: 1px solid black; margin: 2rem 0;">${live_img_preview(entry)}</div>
              <div>Progress: ${entry.progress}</div>
              <a href="#" phx-click="cancel" phx-value-config_name="photos" phx-value-ref="${entry.ref}">&times;</a>
            </div>
          `;
        })}

        ${submit("Save", { phx_disable_with: "Saving...", disabled: uploads.photos.errors.length > 0 })}
      </form>
      ${JSON.stringify(uploads.photos)}
      <ul id="photo_list" phx-update="prepend">
        ${photos.map((photo) => html`<li id="${photo.id}">${photo.id}</li>`)}
      </ul>
    `;
  },
});
