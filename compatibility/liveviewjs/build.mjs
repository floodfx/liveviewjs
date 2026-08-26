import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const appRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(appRoot, "../..");
const nodePaths = [resolve(appRoot, "node_modules")];

await mkdir(resolve(appRoot, "build"), { recursive: true });
await mkdir(resolve(appRoot, "public/assets"), { recursive: true });

await Promise.all([
  build({
    entryPoints: [resolve(appRoot, "src/client.js")],
    outfile: resolve(appRoot, "public/assets/app.js"),
    bundle: true,
    format: "esm",
    platform: "browser",
    nodePaths,
  }),
  build({
    entryPoints: [resolve(appRoot, "src/server.ts")],
    outfile: resolve(appRoot, "build/server.cjs"),
    bundle: true,
    format: "cjs",
    platform: "node",
    nodePaths,
    plugins: [
      {
        name: "liveviewjs-source",
        setup(context) {
          context.onResolve({ filter: /^liveviewjs$/ }, () => ({
            path: resolve(repositoryRoot, "packages/core/src/server/index.ts"),
          }));
        },
      },
    ],
  }),
]);
