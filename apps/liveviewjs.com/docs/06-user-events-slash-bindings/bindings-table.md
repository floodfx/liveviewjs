---
sidebar_position: 4
---

# Phoenix LiveView Bindings

Here is a table of all the bindings available in Phoenix LiveView and whether they are available in LiveViewJS.

:::info These bindings actually come from [Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/bindings.html) since
we use the same client-side JavaScript library. The table below denotes which bindings are "Supported" in **LiveViewJS**
and which are not. Bindings below marked with ✅ are working and tested and most of them have example usage in the
`examples` codebase. Those with `?`, we have not gotten around to testing so not sure if they work. Those marked with ❌
are not yet implemented and known not to work. :::

| Binding         | Attribute            | Supported |
| --------------- | -------------------- | --------- |
| Params          | `phx-value-*`        | ✅        |
| Click Events    | `phx-click`          | ✅        |
| Click Events    | `phx-click-away`     | ✅        |
| Form Events     | `phx-change`         | ✅        |
| Form Events     | `phx-submit`         | ✅        |
| Form Events     | `phx-feedback-for`   | ✅        |
| Form Events     | `phx-disable-with`   | ✅        |
| Form Events     | `phx-trigger-action` | ﹖        |
| Form Events     | `phx-auto-recover`   | ﹖        |
| Focus Events    | `phx-blur`           | ✅        |
| Focus Events    | `phx-focus`          | ✅        |
| Focus Events    | `phx-window-blur`    | ✅        |
| Focus Events    | `phx-window-focus`   | ✅        |
| Key Events      | `phx-keydown`        | ✅        |
| Key Events      | `phx-keyup`          | ✅        |
| Key Events      | `phx-window-keydown` | ✅        |
| Key Events      | `phx-window-keyup`   | ✅        |
| Key Events      | `phx-key`            | ✅        |
| DOM Patching    | `phx-update`         | ✅        |
| DOM Patching    | `phx-remove`         | ﹖        |
| JS Interop      | `phx-hook`           | ✅        |
| Rate Limiting   | `phx-debounce`       | ✅        |
| Rate Limiting   | `phx-throttle`       | ✅        |
| Static Tracking | `phx-track-static`   | ❌        |
