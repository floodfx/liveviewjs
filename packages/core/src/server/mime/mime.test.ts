import { mime } from ".";

describe("test mime", () => {
  beforeAll(async () => {
    await mime.load();
  });
  it("lookupMime by ext", async () => {
    expect(mime.loaded).toBeTruthy();
    expect(mime.lookupMimeType("pdf")).toContain("application/pdf");
  });

  it("lookupExt by mime", async () => {
    expect(mime.loaded).toBeTruthy();
    expect(mime.lookupExtensions("application/pdf")).toContain("pdf");
  });
});
