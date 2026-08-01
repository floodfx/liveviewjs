import { HtmlSafeString } from "./htmlSafeString";

export type JSXElement = HtmlSafeString;

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
 * Allows writing class-based or functional LiveViews using JSX/TSX syntax.
 *
 * @example
 * // tsconfig.json: "jsx": "react", "jsxFactory": "jsx"
 * const template = <div id="card"><h1>Count: {count}</h1></div>;
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
