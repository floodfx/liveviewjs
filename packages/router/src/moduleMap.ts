import type { RouteDefinition, MatchResult, LayoutFunction } from "./types";
import { normalizeFilePathToRoute, matchRoute } from "./patternMatcher";

export interface LiveViewModuleMapRouter<T = any> {
  routes: RouteDefinition<T>[];
  match(url: string): MatchResult<T> | null;
}

/**
 * Creates a type-safe LiveView router from a static module map (e.g. Vite import.meta.glob).
 * Cross-runtime compatible for serverless, Edge, and bundled applications.
 */
export function createModuleMapRouter<T = any>(
  moduleMap: Record<string, any>
): LiveViewModuleMapRouter<T> {
  const routes: RouteDefinition<T>[] = [];
  const layoutMap = new Map<string, LayoutFunction>();

  // First pass: extract layout modules (_layout.tsx or _layout.ts)
  for (const [rawPath, mod] of Object.entries(moduleMap)) {
    const cleanPath = rawPath.replace(/^(\.\/|\/)/, "");
    if (cleanPath.endsWith("_layout.tsx") || cleanPath.endsWith("_layout.ts") || cleanPath.endsWith("layout.tsx")) {
      const layoutFn = mod.default || mod;
      if (typeof layoutFn === "function") {
        const dir = cleanPath.substring(0, cleanPath.lastIndexOf("/"));
        layoutMap.set(dir === "" ? "." : dir, layoutFn);
      }
    }
  }

  // Second pass: extract LiveView route modules
  for (const [rawPath, mod] of Object.entries(moduleMap)) {
    const cleanPath = rawPath.replace(/^(\.\/|\/)/, "");

    // Skip layout files
    if (cleanPath.endsWith("_layout.tsx") || cleanPath.endsWith("_layout.ts") || cleanPath.endsWith("layout.tsx")) {
      continue;
    }

    const component = mod.default || mod;
    if (!component) continue;

    // Strip leading directory prefixes like "liveviews/" or "pages/"
    const relativeFilePath = cleanPath.replace(/^(liveviews|pages|app\/liveviews)\//, "");
    const pathPattern = normalizeFilePathToRoute(relativeFilePath);

    // Resolve cascading layouts for this file's directory path
    const layouts: LayoutFunction[] = [];
    const dirSegments = cleanPath.split("/").slice(0, -1);
    let currentDir = "";

    for (let i = 0; i <= dirSegments.length; i++) {
      currentDir = i === 0 ? "." : dirSegments.slice(0, i).join("/");
      if (layoutMap.has(currentDir)) {
        layouts.push(layoutMap.get(currentDir)!);
      }
    }

    routes.push({
      pathPattern,
      filePath: cleanPath,
      component,
      layouts,
    });
  }

  return {
    routes,
    match: (url: string) => matchRoute(routes, url),
  };
}
