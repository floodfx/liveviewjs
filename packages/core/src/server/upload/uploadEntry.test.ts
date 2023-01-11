import { UploadConfig, UploadEntry } from ".";
import { mime } from "../mime";

describe("uploadEntry tests", () => {
  beforeAll(async () => {
    // force mime db to load
    await mime.load();
  });
  it("test too large", async () => {
    const uc = new UploadConfig("foo", {
      accept: [".pdf"],
      max_entries: 1,
      max_file_size: 100,
    });
    // override the ref so always the same for testing
    uc.ref = "phx-testid";
    const activeEntry = new UploadEntry(
      { name: "entry0", last_modified: 11111111, path: "somepath", ref: "0", size: 101, type: "application/pdf" },
      uc
    );
    uc.setEntries([activeEntry]);
    expect(uc.errors).toContain("Too large");
  });

  it("test found mime types", async () => {
    const uc = new UploadConfig("foo", {
      accept: ["image/png"],
      max_entries: 1,
      max_file_size: 1000,
    });
    // override the ref so always the same for testing
    uc.ref = "phx-testid";
    const activeEntry = new UploadEntry(
      { name: "entry0", last_modified: 11111111, path: "somepath", ref: "0", size: 100, type: "image/png" },
      uc
    );
    uc.setEntries([activeEntry]);
    expect(uc.errors).toHaveLength(0);
  });
});
