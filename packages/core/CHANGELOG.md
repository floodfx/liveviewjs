# liveviewjs

## 0.7.5

### Patch Changes

- 08e4e41: Fix unsubscribe bug with undefined subscriber

## 0.7.4

### Patch Changes

- 6318d39: Fix bug where handleInfo was not being awaited

## 0.7.3

### Patch Changes

- c6f6985: Support Node16+ (add polyfills for fetch and structuredClone)

## 0.7.2

### Patch Changes

- a927c16: Support path params in route
  - Core: Support path params in routes for HTTP and WS
  - Examples: Add "helloNameLiveView" example
  - Express / Deno: Update server integration to use `matchRoute` helper

## 0.7.1

### Patch Changes

- 2385ba3: Fix deepDiff bug where old vs new parts key length is different

## 0.7.0

### Minor Changes

- 9137425: Some renaming and minor API changes

## 0.6.0

### Minor Changes

- bb45657: Upload file support

  - Move minimum supported node version to 18+ (necessary for global `fetch` support)
  - Add support for uploading files to LiveViewJS (and saving to filesystem)
  - New methods to LiveSocket: `allowUpload`, `cancelUpload`, `uploadedEntries`, and `consumeUploadedEntries`
  - Support LiveView protocol messages for uploads: `allow_upload`, `progress`, `phx_join` (upload topic "lvu:")
  - Support phx binary messages for uploads (including serialization/de-serialization)
  - `live_img_preview` and `live_file_input` tags
  - Updated `WsMessageRouter` to require `FileSystemAdaptor` abstraction
  - `photos` example LiveView

  Related updates

  - Experimental `InMemoryChangesetDB` for examples
  - Support render for arrays of non-HtmlSafeString objects (helps debugging)
  - Add `FileSystemAdaptor` to abstract away filesystem across Deno and NodeJS
  - Refactor `SerDe` interface to allow type for serialized data
  - Refactor `LiveViewChangeset` to look for `_target` hints and only show error(s) for `_target` field if present
  - Change `AnyLiveEvent` values to be `any` (expect dev to use zod to parse)
  - Add basic mime and file extension library (using "mime-db" json file)
  - Add `xkcd` example LiveView
  - Revamp Turborepo usage incluing adding consistent package.json scripts and better config
  - Tons of other small improvements and bug fixes

## 0.5.1

### Patch Changes

- 9aa6310: Document JS Commands and minor refactoring

## 0.5.0

### Minor Changes

- b1fa3a7: Add JS Commands to LiveViewJS

## 0.4.4

### Patch Changes

- 9caae42: New patch to test release
- d756d13: add test skip for locally dependent test
