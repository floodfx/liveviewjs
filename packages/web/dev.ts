import { plugin } from "bun";
import { transformJsxToLiveViewHtml } from "../core/src/server/templates/jsx";

// Register transparent JSX2TTL compiler plugin BEFORE importing LiveView JSX modules
plugin({
  name: "liveview-jsx",
  setup(build) {
    build.onLoad({ filter: /\.(jsx|tsx)$/ }, async (args) => {
      const contents = await Bun.file(args.path).text();
      const jsCode = transformJsxToLiveViewHtml(contents, {
        importPath: "../../core/src/index",
        importName: "html",
      });
      return {
        contents: jsCode,
        loader: "js",
      };
    });
  },
});

import { WebLiveViewHandler } from "./src/webLiveViewHandler";
import { NavHeader } from "./examples/components";
import { TaskTrackerLiveView } from "./examples/TaskTrackerLiveView";
import { GradientStudioLiveView } from "./examples/GradientStudioLiveView";

// Dynamically import ThermostatLiveView after plugin registration
const { ThermostatLiveView } = await import("./examples/ThermostatLiveView.jsx");

// Initialize Router with clean, standalone LiveView modules
const router = {
  "/": new ThermostatLiveView() as any,
  "/jsx": new ThermostatLiveView() as any,
  "/tsx": new TaskTrackerLiveView() as any,
  "/ttl": new GradientStudioLiveView() as any,
};

const handler = new WebLiveViewHandler({ router });
const port = 3000;
const bunConfig = handler.bun({ port });
const originalFetch = bunConfig.fetch;

// Inject Tailwind CSS script and clean layout shell
bunConfig.fetch = async (req: Request, server: any) => {
  const response = await originalFetch(req, server);
  if (response && response.headers.get("content-type")?.includes("text/html")) {
    const url = new URL(req.url);
    let htmlText = await response.text();
    const navHtml = NavHeader({ currentPath: url.pathname }).toString();

    // Inject Tailwind CSS CDN
    htmlText = htmlText.replace(
      "</head>",
      `<script src="https://cdn.tailwindcss.com"></script></head>`
    );

    // Inject flex layout wrapper in body
    htmlText = htmlText.replace(
      "<body>",
      `<body class="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 antialiased font-sans">${navHtml}`
    );

    return new Response(htmlText, {
      status: response.status,
      headers: response.headers,
    });
  }
  return response;
};

console.log(`\n🚀 LiveViewJS Multi-Engine Tailwind Dev Server running at: http://localhost:${port}`);
console.log(`   - JSX  Route: http://localhost:${port}/jsx`);
console.log(`   - TSX  Route: http://localhost:${port}/tsx`);
console.log(`   - TTL  Route: http://localhost:${port}/ttl\n`);

Bun.serve(bunConfig);
