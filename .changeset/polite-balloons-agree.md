---
"liveviewjs": minor
"@liveviewjs/examples": minor
"@liveviewjs/express": minor
---

Upload file support
 * Move minimum supported node version to 18+ (necessary for global `fetch` support)
 * Add support for uploading files to LiveViewJS (and saving to filesystem)
 * New methods to LiveSocket: `allowUpload`, `cancelUpload`, `uploadedEntries`, and `consumeUploadedEntries`
 * Support LiveView protocol messages for uploads: `allow_upload`, `progress`, `phx_join` (upload topic "lvu:")
 * Support phx binary messages for uploads (including serialization/de-serialization)
 * `live_img_preview` and `live_file_input` tags
 * Updated `WsMessageRouter` to require `FileSystemAdaptor` abstraction
 * `photos` example LiveView

Related updates
 * Experimental `InMemoryChangesetDB` for examples
 * Support render for arrays of non-HtmlSafeString objects (helps debugging)
 * Add `FileSystemAdaptor` to abstract away filesystem across Deno and NodeJS
 * Refactor `SerDe` interface to allow type for serialized data
 * Refactor `LiveViewChangeset` to look for `_target` hints and only show error(s) for `_target` field if present
 * Change `AnyLiveEvent` values to be `any` (expect dev to use zod to parse)
 * Add basic mime and file extension library (using "mime-db" json file)
 * Add `xkcd` example LiveView
 * Revamp Turborepo usage incluing adding consistent package.json scripts and better config
 * Tons of other small improvements and bug fixes
