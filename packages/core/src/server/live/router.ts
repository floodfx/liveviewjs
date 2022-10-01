import { match, MatchFunction, MatchResult } from "path-to-regexp";
import { AnyLiveContext, AnyLiveEvent, AnyLiveInfo, LiveView } from "./liveView";

export interface LiveViewRouter {
  [key: string]: LiveView<AnyLiveContext, AnyLiveEvent, AnyLiveInfo>;
}

export type PathParams = { [key: string]: string };

const matchFns: { [key: string]: MatchFunction<PathParams> } = {};
export function matchRoute(
  router: LiveViewRouter,
  path: string
): [LiveView<AnyLiveContext, AnyLiveEvent, AnyLiveInfo>, MatchResult<PathParams>] | undefined {
  for (const route in router) {
    let matchFn = matchFns[route];
    if (!matchFn) {
      // lazy init match function
      matchFn = match(route, { decode: decodeURIComponent });
      matchFns[route] = matchFn;
    }
    // match the path to the route match function
    const matchResult = matchFn(path);
    if (matchResult) {
      return [router[route], matchResult];
    }
  }
  return undefined;
}
