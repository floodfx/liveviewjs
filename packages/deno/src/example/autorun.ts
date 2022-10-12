import * as esbuild from "https://deno.land/x/esbuild@v0.15.9/mod.js";

// Build / watch the client code
esbuild
  .build({
    entryPoints: ["src/client/index.ts"],
    outdir: "public/js",
    bundle: true,
    format: "esm",
    platform: "browser",
    sourcemap: true,
    watch: {
      onRebuild(error) {
        if (error) {
          console.error("client rebuild failed");
          console.error(error);
        } else {
          console.log("client build succeeded");
        }
      },
    },
  })
  .then((result) => {
    if (result.errors.length > 0) {
      console.error(result.errors);
    } else {
      console.log("client build succeeded");
    }
  });

// Spawn the server
Deno.run({
  cmd: "deno run --unstable --allow-net --allow-read --allow-write --allow-env --import-map=import_map.json --watch src/example/index.ts".split(
    " "
  ),
});
