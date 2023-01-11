import { UploadConfig, UploadEntry } from ".";

describe("additional uploadConfig test", () => {
  it("test too many files", async () => {
    const uc = new UploadConfig("foo", {
      accept: [".pdf"],
      max_entries: 1,
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
    doneEntry.updateProgress(100);
    uc.setEntries([activeEntry, doneEntry]);
    expect(uc.errors).toContain("Too many files");
  });
});
