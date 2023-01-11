import { UploadConfig, UploadEntry } from "../../upload";
import { live_img_preview } from "./live_img_preview";

describe("live_img_preview test", () => {
  it("live_img_preview", () => {
    const uc = new UploadConfig("foo", {
      accept: [".png"],
      max_entries: 2,
    });
    // override the ref so always the same for testing
    uc.ref = "phx-testid";
    const entry = new UploadEntry(
      { name: "entry0", last_modified: 11111111, path: "somepath", ref: "0", size: 1000, type: "application/pdf" },
      uc
    );

    const l = live_img_preview(entry);
    expect(l.toString()).toMatchInlineSnapshot(`
      "
          <img
            id=\\"phx-preview-0\\"
            data-phx-upload-ref=\\"phx-testid\\"
            data-phx-entry-ref=\\"0\\"
            data-phx-hook=\\"Phoenix.LiveImgPreview\\"
            data-phx-update=\\"ignore\\" />
        "
    `);
  });
});
