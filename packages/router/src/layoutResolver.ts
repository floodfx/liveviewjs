import type { LayoutResolverOptions, LayoutProps } from "./types";

/**
 * Resolves and cascades nested layout functions around child LiveView content.
 * If optOut is true, layout wrapping is bypassed.
 */
export function resolveCascadingLayout(options: LayoutResolverOptions): any {
  const { childContent, layouts = [], currentPath, pathParams, queryParams, optOut = false } = options;

  if (optOut || layouts.length === 0) {
    return childContent;
  }

  const props: LayoutProps = {
    children: childContent,
    currentPath,
    pathParams,
    queryParams,
  };

  // Reverse layouts so the innermost layout runs first, followed by outer parent layouts
  let currentContent = childContent;
  const reversed = [...layouts].reverse();

  for (const layoutFn of reversed) {
    currentContent = layoutFn({
      ...props,
      children: currentContent,
    });
  }

  return currentContent;
}
