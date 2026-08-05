// @ts-ignore
import { jsx2ttl as _jsx2ttl } from "jsx2ttl";

export type JSX2TTLOptions = {
  importPath?: string;
  importName?: string;
  mode?: string;
  [key: string]: any;
};

export const jsx2ttl = _jsx2ttl;

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
 */
export function transformJsxToLiveViewHtml(
  jsxCode: string,
  options: JSX2TTLOptions = defaultLiveViewJsx2TtlOptions
): string {
  return (_jsx2ttl as any)(jsxCode, options);
}

let isCompilerRegistered = false;

/**
 * Automatically registers runtime-agnostic transparent JSX/TSX compiler plugins
 * for Bun, Deno, or Node.js without requiring developer configuration.
 */
export function autoRegisterJsxCompiler(options?: JSX2TTLOptions): void {
  if (isCompilerRegistered) return;
  isCompilerRegistered = true;

  const opts = { ...defaultLiveViewJsx2TtlOptions, ...options };

  try {
    // 1. Bun Runtime Detection
    if (typeof (globalThis as any).Bun !== "undefined") {
      const bun = (globalThis as any).Bun;
      bun.plugin({
        name: "liveviewjs-auto-jsx",
        setup(build: any) {
          build.onLoad({ filter: /\.(jsx|tsx)$/ }, async (args: any) => {
            const contents = await bun.file(args.path).text();
            const jsCode = transformJsxToLiveViewHtml(contents, opts);
            return { contents: jsCode, loader: "js" };
          });
        },
      });
    }
  } catch (err) {
    // Suppress plugin duplicate registration warnings
  }
}
