import { jsx2ttl, type JSX2TTLOptions } from "jsx2ttl";
import { html, HtmlSafeString } from "./htmlSafeString";

export type { JSX2TTLOptions };
export { jsx2ttl };

/**
 * Default configuration options for converting JSX/TSX to LiveViewJS `html` tagged template literals using `jsx2ttl`.
 */
export const defaultLiveViewJsx2TtlOptions: JSX2TTLOptions = {
  importPath: "@liveviewjs/core",
  importName: "html",
  mode: "taggedTemplate",
};

/**
 * Transforms JSX/TSX code string directly into LiveViewJS template code using `jsx2ttl`.
 *
 * @param jsxCode JSX or TSX code string
 * @param options optional custom jsx2ttl configuration options
 * @returns transformed template code string using `html\`...\`` tagged template literals
 *
 * @example
 * const code = transformJsxToLiveViewHtml('<div id="card">Count: {count}</div>');
 * // Output: html`<div id="card">Count: ${count}</div>`
 */
export function transformJsxToLiveViewHtml(
  jsxCode: string,
  options: JSX2TTLOptions = defaultLiveViewJsx2TtlOptions
): string {
  return jsx2ttl(jsxCode, options);
}
