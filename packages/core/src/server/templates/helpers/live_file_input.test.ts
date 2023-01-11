import { UploadConfig, UploadEntry } from "../../upload";
import { live_file_input } from "./live_file_input";

describe("live_file_input test", () => {
  it("returns basic live_file_input", () => {
    const uc = new UploadConfig("foo");
    // override the ref so always the same for testing
    uc.ref = "phx-testid";
    const l = live_file_input(uc);
    expect(l.toString()).toMatchInlineSnapshot(`
      "
          <input
            id=\\"phx-testid\\"
            type=\\"file\\"
            name=\\"foo\\"
            accept=\\"\\"
            data-phx-active-refs=\\"\\"
            data-phx-done-refs=\\"\\"
            data-phx-preflighted-refs=\\"\\"
            data-phx-update=\\"ignore\\"
            data-phx-upload-ref=\\"phx-testid\\"
            phx-hook=\\"Phoenix.LiveFileUpload\\"
             />
        "
    `);
  });

  it("returns more complex live_file_input", () => {
    const uc = new UploadConfig("foo", {
      accept: ["image/*"],
      max_entries: 2,
      auto_upload: true,
      max_file_size: 1500000,
    });
    // override the ref so always the same for testing
    uc.ref = "phx-testid";
    const l = live_file_input(uc);
    expect(l.toString()).toMatchInlineSnapshot(`
      "
          <input
            id=\\"phx-testid\\"
            type=\\"file\\"
            name=\\"foo\\"
            accept=\\"image&#x2F;*\\"
            data-phx-active-refs=\\"\\"
            data-phx-done-refs=\\"\\"
            data-phx-preflighted-refs=\\"\\"
            data-phx-update=\\"ignore\\"
            data-phx-upload-ref=\\"phx-testid\\"
            phx-hook=\\"Phoenix.LiveFileUpload\\"
            multiple />
        "
    `);
  });

  it("returns more complex live_file_input with entries", () => {
    const uc = new UploadConfig("foo", {
      accept: [".pdf"],
      max_entries: 3,
    });
    // override the ref so always the same for testing
    uc.ref = "phx-testid";
    const activeEntry = new UploadEntry(
      { name: "entry0", last_modified: 11111111, path: "somepath", ref: "0", size: 1000, type: "application/pdf" },
      uc
    );
    const doneEntry = new UploadEntry(
      { name: "entry1", last_modified: 11111111, path: "somepath", ref: "1", size: 1000, type: "application/pdf" },
      uc
    );
    const doneEntry2 = new UploadEntry(
      { name: "entry2", last_modified: 11111111, path: "somepath", ref: "2", size: 1000, type: "application/pdf" },
      uc
    );
    doneEntry.updateProgress(100);
    uc.entries = [activeEntry, doneEntry, doneEntry2];
    const l = live_file_input(uc);
    expect(l.toString()).toMatchInlineSnapshot(`
      "
          <input
            id=\\"phx-testid\\"
            type=\\"file\\"
            name=\\"foo\\"
            accept=\\".pdf\\"
            data-phx-active-refs=\\"0,1,2\\"
            data-phx-done-refs=\\"1\\"
            data-phx-preflighted-refs=\\"1\\"
            data-phx-update=\\"ignore\\"
            data-phx-upload-ref=\\"phx-testid\\"
            phx-hook=\\"Phoenix.LiveFileUpload\\"
            multiple />
        "
    `);
  });
});
