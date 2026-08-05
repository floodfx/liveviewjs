import type { Plugin } from "vite";
import { transformJsxToLiveViewHtml, JSX2TTLOptions } from "@liveviewjs/core/jsx";

export interface LiveViewVitePluginOptions extends JSX2TTLOptions {
  include?: RegExp;
}

/**
 * Official Vite Plugin for LiveViewJS.
 * Transparently transpiles classic `.jsx` and `.tsx` LiveView files into
 * high-performance LiveViewJS tagged template literals during dev (HMR) and production builds.
 */
export function liveViewPlugin(options: LiveViewVitePluginOptions = {}): Plugin {
  const { include = /\.(jsx|tsx)$/, ...jsxOptions } = options;

  return {
    name: "liveviewjs-vite-plugin",
    enforce: "pre",
    transform(code: string, id: string) {
      if (include.test(id)) {
        try {
          const compiled = transformJsxToLiveViewHtml(code, jsxOptions);
          return {
            code: compiled,
            map: null,
          };
        } catch (error) {
          console.error(`[liveviewjs/vite] Failed to transpile ${id}:`, error);
        }
      }
    },
  };
}

export default liveViewPlugin;
