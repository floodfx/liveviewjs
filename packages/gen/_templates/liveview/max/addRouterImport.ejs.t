---
inject: true
to: src/server/liveview/router.ts
after: liveviewjs
---
import { <%= h.inflection.camelize(name, false) %> } from "./<%= h.inflection.camelize(name) %><% if (runtime === "deno") { %>.ts<% } %>";