---
"@liveviewjs/lambda-examples": minor
"liveviewjs": minor
"@liveviewjs/examples": minor
"@liveviewjs/express": minor
---

## Summary
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
