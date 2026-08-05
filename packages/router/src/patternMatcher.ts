import { pathToRegexp, match as createMatch } from "path-to-regexp";
import type { RouteDefinition, MatchResult } from "./types";

/**
 * Normalizes file system relative paths into URL route patterns.
 * e.g.
 * - "index.tsx" -> "/"
 * - "about.tsx" -> "/about"
 * - "users/index.tsx" -> "/users"
 * - "users/[id].tsx" or "users/:id.tsx" -> "/users/:id"
 * - "users/[id]/settings.tsx" -> "/users/:id/settings"
 * - "docs/[...slug].tsx" -> "/docs/*"
 */
export function normalizeFilePathToRoute(filePath: string): string {
  // Remove file extensions (.tsx, .jsx, .ts, .js)
  let route = filePath.replace(/\.(tsx|jsx|ts|js)$/, "");

  // Standardize backslashes to forward slashes
  route = route.replace(/\\/g, "/");

  // Handle Next.js style catch-all [...slug] -> *
  route = route.replace(/\[\.\.\.[^\]]+\]/g, "*");

  // Handle Next.js style dynamic params [id] -> :id
  route = route.replace(/\[([^\]]+)\]/g, ":$1");

  // Remove trailing /index or index
  if (route === "index" || route === "/index") {
    return "/";
  }
  route = route.replace(/\/index$/, "");

  // Ensure leading slash
  if (!route.startsWith("/")) {
    route = "/" + route;
  }

  return route;
}

/**
 * Parses query strings from a URL path.
 * e.g. "/users/42?theme=dark&tab=sec" -> { pathOnly: "/users/42", queryParams: { theme: "dark", tab: "sec" } }
 */
export function parseUrlQuery(url: string): { pathOnly: string; queryParams: Record<string, string> } {
  const qIdx = url.indexOf("?");
  if (qIdx === -1) {
    return { pathOnly: url, queryParams: {} };
  }

  const pathOnly = url.slice(0, qIdx);
  const searchStr = url.slice(qIdx + 1);
  const queryParams: Record<string, string> = {};

  const searchParams = new URLSearchParams(searchStr);
  searchParams.forEach((val, key) => {
    queryParams[key] = val;
  });

  return { pathOnly, queryParams };
}

/**
 * Scores and ranks route definitions by specificity:
 * 1. Exact static paths come first.
 * 2. Dynamic parameter paths come second.
 * 3. Wildcards come last.
 */
export function sortRoutes<T>(routes: RouteDefinition<T>[]): RouteDefinition<T>[] {
  return [...routes].sort((a, b) => {
    const scoreA = getRouteScore(a.pathPattern);
    const scoreB = getRouteScore(b.pathPattern);
    return scoreB - scoreA;
  });
}

function getRouteScore(pattern: string): number {
  let score = 100;
  if (pattern.includes("*")) score -= 50;
  if (pattern.includes(":")) score -= 10;
  const segments = pattern.split("/").filter(Boolean);
  score += segments.length * 2;
  return score;
}

/**
 * Matches a request URL path against a set of route definitions.
 */
export function matchRoute<T>(routes: RouteDefinition<T>[], url: string): MatchResult<T> | null {
  const { pathOnly, queryParams } = parseUrlQuery(url);
  const sorted = sortRoutes(routes);

  for (const route of sorted) {
    const pattern = route.pathPattern;

    // Handle wildcard suffix /docs/* or *
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2);
      if (pathOnly === prefix || pathOnly.startsWith(prefix + "/")) {
        const slug = pathOnly.slice(prefix.length + 1);
        return {
          route,
          params: { slug },
          queryParams,
        };
      }
    }

    if (pattern === "*") {
      return {
        route,
        params: { slug: pathOnly },
        queryParams,
      };
    }

    try {
      const matcher = createMatch(pattern, { decode: decodeURIComponent });
      const matched = matcher(pathOnly);

      if (matched) {
        const rawParams = (matched.params || {}) as Record<string, any>;
        const params: Record<string, string> = {};

        for (const [k, v] of Object.entries(rawParams)) {
          if (Array.isArray(v)) {
            params[k] = v.join("/");
          } else if (typeof v === "string") {
            params[k] = v;
          }
        }

        return {
          route,
          params,
          queryParams,
        };
      }
    } catch {
      if (pattern === pathOnly) {
        return {
          route,
          params: {},
          queryParams,
        };
      }
    }
  }

  return null;
}
