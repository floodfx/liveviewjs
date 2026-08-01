import { HtmlSafeString } from "./htmlSafeString";

export type JSXElement = HtmlSafeString;

/**
 * Recommended `jsx2ttl` compiler plugin configuration options for LiveViewJS.
 *
 * `jsx2ttl` (https://github.com/floodfx/jsx2ttl) transforms JSX elements at build-time
 * directly into LiveViewJS `html` tagged template literals (mode: 'taggedTemplate')
 * or `HtmlSafeString` constructors (mode: 'constructor').
 *
 * @example
 * // jsx2ttl configuration in Babel, Bun, or Vite pipeline:
 * import { liveViewJsx2TtlOptions } from "@liveviewjs/core";
 */
export const liveViewJsx2TtlOptions = {
  importPath: "@liveviewjs/core",
  importName: "html",
  mode: "taggedTemplate" as const,
};

/**
 * Converts camelCase attribute names to kebab-case (e.g. phxClick -> phx-click, className -> class).
 */
function attributeToKebabCase(key: string): string {
  if (key === "className") return "class";
  if (key === "htmlFor") return "for";
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Runtime JSX Factory fallback for LiveViewJS (`jsx` / `jsxs` / `createElement`).
 * Allows writing class-based or functional LiveViews using JSX/TSX syntax without build steps.
 *
 * For zero-runtime compile-time transformations, use `jsx2ttl` (https://github.com/floodfx/jsx2ttl).
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
