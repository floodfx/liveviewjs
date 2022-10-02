import { mime, nodeHttpFetch } from ".";

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

  it("http requests success", async () => {
    const res = await nodeHttpFetch("https://cdn.jsdelivr.net/gh/jshttp/mime-db@master/db.json");
    expect(res).toBeTruthy();
  });
});
