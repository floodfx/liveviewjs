# @liveviewjs/lambda-examples

## 0.10.4

### Patch Changes

- 87b658d: Detect closed sockets and handle more gracefully
- Updated dependencies [87b658d]
  - liveviewjs@0.10.4
  - @liveviewjs/examples@0.10.4
  - @liveviewjs/express@0.10.4

## 0.10.3

### Patch Changes

- 4673b8d: Run npm install for deno client-side javascript
- Updated dependencies [4673b8d]
  - liveviewjs@0.10.3
  - @liveviewjs/examples@0.10.3
  - @liveviewjs/express@0.10.3

## 0.10.2

### Patch Changes

- 10fefe0: Fix package bin, main, types, and files for gen package
- Updated dependencies [10fefe0]
  - liveviewjs@0.10.2
  - @liveviewjs/examples@0.10.2
  - @liveviewjs/express@0.10.2

## 0.10.1

### Patch Changes

- 2fd427a: Revamp gen package and add deno project generator
- Updated dependencies [2fd427a]
  - liveviewjs@0.10.1
  - @liveviewjs/examples@0.10.1
  - @liveviewjs/express@0.10.1

## 0.10.0

### Minor Changes

- 921e914: Initial LiveViewJS code gen infrastructure and nodejs project generator

### Patch Changes

- Updated dependencies [921e914]
  - liveviewjs@0.10.0
  - @liveviewjs/examples@0.10.0
  - @liveviewjs/express@0.10.0

## 0.2.1

### Patch Changes

- 2920d49: Refactor LiveViewServer interface and NodeJS / Deno boilerplate
- Updated dependencies [2920d49]
  - liveviewjs@0.9.1
  - @liveviewjs/examples@0.9.1
  - @liveviewjs/express@0.9.1

## 0.2.0

### Minor Changes

- 5689b18: Complete refactoring by adding support for LiveComponents

### Patch Changes

- Updated dependencies [5689b18]
  - liveviewjs@0.9.0
  - @liveviewjs/examples@0.9.0
  - @liveviewjs/express@0.9.0

## 0.1.2

### Patch Changes

- fb4fbaa: Event value can be a non-object, so fix that and add debug hook while we are at it.
- Updated dependencies [fb4fbaa]
  - liveviewjs@0.8.2
  - @liveviewjs/examples@0.8.2
  - @liveviewjs/express@0.8.2

## 0.1.1

### Patch Changes

- 0985538: Fix live_patch early return bug and add option onError server config
- Updated dependencies [0985538]
  - liveviewjs@0.8.1
  - @liveviewjs/examples@0.8.1
  - @liveviewjs/express@0.8.1

## 0.1.0

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
  - @liveviewjs/examples@0.8.0
  - @liveviewjs/express@0.8.0
