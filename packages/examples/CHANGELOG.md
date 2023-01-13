# @liveviewjs/examples

## 0.8.2

### Patch Changes

- fb4fbaa: Event value can be a non-object, so fix that and add debug hook while we are at it.
- Updated dependencies [fb4fbaa]
  - liveviewjs@0.8.2

## 0.8.1

### Patch Changes

- 0985538: Fix live_patch early return bug and add option onError server config
- Updated dependencies [0985538]
  - liveviewjs@0.8.1

## 0.8.0

### Minor Changes

- 1068f78: ## Summary
  Largely refactored LiveViewManager and WsMessageRouter into a simpler and better architected WsHandler along with related changes and documentation.

  ## Changes

  Fix refactor update

  Lots of documentation improvements

  More cleanup

  - stop heartbeat on leave
  - add url to LiveSocket
  - reimplement liveNav
  - add liveNav example

  Add support for pushEvents

  - add example in dashboard / nodejs client code to listen for pushEvent

  Add pubSub to config and cleanup

  - make pubSub interface required in WsHandlerConfig
  - update Deno and Node servers with pubSub
  - keep track of pubSub subscriptions through socket
  - unsubscribe to pubSub when liveview closed
  - mark wsHandler as closed and ignore subsequent messages

  Redirect every event through handleMsg

  - add active/queue to attempt to prevent race conditions

  Remove socket.repeat

  Move over live_patch messages

  Refactor upload config and options

  Refactor over upload handler logic

  Bring in handleInfo implementation

  - add PhxReply.diff for handleInfo reply
  - update dashboard example to use setInterval instead of socket.repeat

  Refactor phx event messages

  - add EventPayload type to Phx
  - add diffReply to PhxReply
  - put handleEvent in wsEventHandler
  - ignore LiveComponents for now

  Start refactoring process

  - create Phx Msg and Reply protocol package
  - create WsHandler class to replace LiveViewManager
  - revamp WsAdaptor interface and implementations for Deno and Node
  - start refactor of LiveViewServerAdaptor for Deno and Node

### Patch Changes

- Updated dependencies [1068f78]
  - liveviewjs@0.8.0

## 0.7.5

### Patch Changes

- Updated dependencies [08e4e41]
  - liveviewjs@0.7.5

## 0.7.4

### Patch Changes

- Updated dependencies [6318d39]
  - liveviewjs@0.7.4

## 0.7.3

### Patch Changes

- c6f6985: Support Node16+ (add polyfills for fetch and structuredClone)
- Updated dependencies [c6f6985]
  - liveviewjs@0.7.3

## 0.7.2

### Patch Changes

- a927c16: Support path params in route
  - Core: Support path params in routes for HTTP and WS
  - Examples: Add "helloNameLiveView" example
  - Express / Deno: Update server integration to use `matchRoute` helper
- Updated dependencies [a927c16]
  - liveviewjs@0.7.2

## 0.7.1

### Patch Changes

- Updated dependencies [2385ba3]
  - liveviewjs@0.7.1

## 0.7.0

### Patch Changes

- 905f050: Move browser compilation to Express and Deno and some other additional LiveView examples
- Updated dependencies [9137425]
  - liveviewjs@0.7.0

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

### Patch Changes

- Updated dependencies [bb45657]
  - liveviewjs@0.6.0

## 0.5.0

### Minor Changes

- b158c2c: Create an example LiveView showing JS Commands

### Patch Changes

- Updated dependencies [b1fa3a7]
  - liveviewjs@0.5.0

## 0.4.4

### Patch Changes

- 9caae42: New patch to test release
- Updated dependencies [9caae42]
- Updated dependencies [d756d13]
  - liveviewjs@0.4.4
