---
to: <%= h.changeCase.lower(name) %>/src/server/liveview/router.ts
---
import { LiveViewRouter } from "liveviewjs";
import { helloLive } from "./hello.ts";

// configure LiveView routes for <%= h.inflection.camelize(name, false) %>
export const liveRouter: LiveViewRouter = {
  "/hello": helloLive,
  "/hello/:name": helloLive,
};
