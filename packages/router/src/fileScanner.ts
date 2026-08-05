import * as fs from "node:fs";
import * as path from "node:path";
import type { RouteDefinition, MatchResult, LayoutFunction } from "./types";
import { normalizeFilePathToRoute, matchRoute } from "./patternMatcher";

export interface FileSystemRouterOptions {
  /** Directory path to scan for LiveView route files (default: "./liveviews") */
  dir: string;
}

export interface LiveViewFileSystemRouter<T = any> {
  routes: RouteDefinition<T>[];
  match(url: string): MatchResult<T> | null;
}

/**
 * Universal cross-runtime directory scanner (Node.js, Bun, Deno).
 * Automatically scans a directory for LiveView component files and layout wrappers.
 */
export function scanDirectoryFiles(baseDir: string): { relativePath: string; absolutePath: string }[] {
  const files: { relativePath: string; absolutePath: string }[] = [];

  function walk(currentDir: string, relativeDir: string) {
    if (!fs.existsSync(currentDir)) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryAbs = path.join(currentDir, entry.name);
      const entryRel = relativeDir ? path.join(relativeDir, entry.name) : entry.name;

      if (entry.isDirectory()) {
        walk(entryAbs, entryRel);
      } else if (entry.isFile() && /\.(tsx|jsx|ts|js)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".d.ts")) {
        files.push({ relativePath: entryRel, absolutePath: entryAbs });
      }
    }
  }

  walk(baseDir, "");
  return files;
}

/**
 * Creates a LiveView file-system router scanning disk directories synchronously across Node, Bun, and Deno.
 */
export function createFileSystemRouter<T = any>(options: FileSystemRouterOptions): LiveViewFileSystemRouter<T> {
  const baseDir = path.resolve(options.dir);
  const files = scanDirectoryFiles(baseDir);
  const routes: RouteDefinition<T>[] = [];
  const layoutMap = new Map<string, LayoutFunction>();

  // Extract layout files
  for (const file of files) {
    const filename = path.basename(file.relativePath);
    if (filename === "_layout.tsx" || filename === "_layout.ts" || filename === "layout.tsx") {
      try {
        const mod = require(file.absolutePath);
        const layoutFn = mod.default || mod;
        if (typeof layoutFn === "function") {
          const dir = path.dirname(file.relativePath);
          layoutMap.set(dir === "." ? "" : dir, layoutFn);
        }
      } catch {
        // Ignore unresolvable layouts in test mocks
      }
    }
  }

  // Extract route modules
  for (const file of files) {
    const filename = path.basename(file.relativePath);
    if (filename === "_layout.tsx" || filename === "_layout.ts" || filename === "layout.tsx") {
      continue;
    }

    let component: any = null;
    try {
      const mod = require(file.absolutePath);
      component = mod.default || mod;
    } catch {
      component = file.absolutePath;
    }

    const pathPattern = normalizeFilePathToRoute(file.relativePath);

    // Resolve cascading layouts
    const layouts: LayoutFunction[] = [];
    const dirSegments = file.relativePath.split(path.sep).slice(0, -1);

    for (let i = 0; i <= dirSegments.length; i++) {
      const currentDir = i === 0 ? "" : dirSegments.slice(0, i).join(path.sep);
      if (layoutMap.has(currentDir)) {
        layouts.push(layoutMap.get(currentDir)!);
      }
    }

    routes.push({
      pathPattern,
      filePath: file.relativePath,
      component,
      layouts,
    });
  }

  return {
    routes,
    match: (url: string) => matchRoute(routes, url),
  };
}
