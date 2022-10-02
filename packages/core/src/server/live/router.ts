import { match, MatchFunction, MatchResult } from "path-to-regexp";
import { AnyLiveContext, AnyLiveEvent, AnyLiveInfo, LiveView } from "./liveView";

/**
 * Maps a route to a LiveView.
 * e.g. `"/users": UserListLiveView`
 * Routes can be optionally contain parameters which LiveViewJS will automatically
 * extract from the URL path and pass to the LiveView's `mount` method as part
 * of the `params` object.
 * e.g. `"/users/:id": UserLiveView` => `{ id: "123" }`
 */
export interface LiveViewRouter {
  [key: string]: LiveView<AnyLiveContext, AnyLiveEvent, AnyLiveInfo>;
}

/**
 * Type representing parameters extracted from a URL path.
 */
export type PathParams = { [key: string]: string };

const matchFns: { [key: string]: MatchFunction<PathParams> } = {};

/**
 * Helper function that returns a tuple containing the `LiveView` and
 * the `MatchResult` object containing the parameters extracted from the URL path
 * if there is a match.  Returns `undefined` if there is no match.
 * Used internally to match a URL path to a LiveView class for both HTTP and WS
 * requests.
 * @param router the `LiveViewRouter` object
 * @param path the URL path to match
 * @returns a tuple containing the `LiveView` and the `MatchResult` object or `undefined`
 */
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
