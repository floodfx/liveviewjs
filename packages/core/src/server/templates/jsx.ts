import { jsx2ttl, type JSX2TTLOptions } from "jsx2ttl";
import { HtmlSafeString } from "./htmlSafeString";

export type { JSX2TTLOptions };
export { jsx2ttl };

export type JSXElement = HtmlSafeString;

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

/**
 * Converts camelCase attribute names to kebab-case (e.g. phxClick -> phx-click, className -> class).
 */
function attributeToKebabCase(key: string): string {
  if (key === "className") return "class";
  if (key === "htmlFor") return "for";
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * JSX Factory for LiveViewJS (`jsx` / `jsxs` / `createElement`).
 * Allows rendering JSX element tags natively.
 */
export function jsx(
  type: string | ((props: any) => HtmlSafeString),
  props?: Record<string, any> | null,
  ...childrenArgs: any[]
): HtmlSafeString {
  const allProps = props ?? {};

  // Handle component functions
  if (typeof type === "function") {
    const rawChildren = allProps.children ?? (childrenArgs.length > 0 ? childrenArgs : undefined);
    return type({ ...allProps, children: rawChildren });
  }

  const { children: propsChildren, ...attrProps } = allProps;
  const rawChildrenList = childrenArgs.length > 0 ? childrenArgs : propsChildren;

  const statics: string[] = [];
  const dynamics: unknown[] = [];

  let currentStatic = `<${type}`;

  // Process attributes
  for (const [key, value] of Object.entries(attrProps)) {
    const kebabKey = attributeToKebabCase(key);
    if (value === true) {
      currentStatic += ` ${kebabKey}`;
    } else if (value !== false && value !== null && value !== undefined && typeof value !== "function") {
      currentStatic += ` ${kebabKey}="${value}"`;
    }
  }

  currentStatic += `>`;

  // Process children
  const flattenedChildren = Array.isArray(rawChildrenList)
    ? rawChildrenList.flat(Infinity)
    : rawChildrenList !== undefined
    ? [rawChildrenList]
    : [];

  for (const child of flattenedChildren) {
    if (child !== undefined && child !== null && child !== false) {
      if (typeof child === "string") {
        currentStatic += child;
      } else {
        statics.push(currentStatic);
        currentStatic = "";
        dynamics.push(child);
      }
    }
  }

  currentStatic += `</${type}>`;
  statics.push(currentStatic);

  return new HtmlSafeString(statics, dynamics);
}

export const jsxs = jsx;
export const createElement = jsx;
