---
to: <%= h.changeCase.lower(name) %>/import_map.json
---
{
  "imports": {
    "zod": "https://deno.land/x/zod@v3.14.2/mod.ts",
    "crypto": "https://deno.land/std@0.128.0/node/crypto.ts",
    "events": "https://deno.land/std@0.128.0/node/events.ts",
    "nanoid": "https://deno.land/x/nanoid@v3.0.0/mod.ts",
    "path-to-regexp": "https://deno.land/x/path_to_regexp@v6.2.1/index.ts",
    "liveviewjs": "https://raw.githubusercontent.com/floodfx/liveviewjs/main/packages/core/mod.ts",
    "@liveviewjs/deno": "https://raw.githubusercontent.com/floodfx/liveviewjs/main/packages/deno/mod.ts",
    "@liveviewjs/examples": "https://raw.githubusercontent.com/floodfx/liveviewjs/main/packages/examples/mod.ts"
  }
}
