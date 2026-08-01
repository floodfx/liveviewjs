import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { WebLiveViewHandler } from "../../src/webLiveViewHandler";
import { transformJsxToLiveViewHtml } from "../../../core/src/index";
import { TsxCounterView } from "./tsxView";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

describe("E2E Real-Time Engine with Genuine TSX Components", () => {
  let server: ReturnType<typeof Bun.serve>;
  let baseUrl: string;

  beforeAll(() => {
    // Mount genuine TsxCounterView class imported directly from ./tsxView.tsx
    const handler = new WebLiveViewHandler({
      router: {
        "/tsx-counter": new TsxCounterView() as any,
      },
      signingSecret: "tsx-file-e2e-secret",
    });

    const bunConfig = handler.bun({ port: 0 });
    server = Bun.serve({
      port: bunConfig.port,
      fetch: bunConfig.fetch,
      websocket: bunConfig.websocket,
    });

    baseUrl = `http://localhost:${server.port}`;
  });

  afterAll(() => {
    server?.stop(true);
  });

  test("1. jsx2ttl parses genuine TSX JSX tags in tsxView.tsx and converts them to html`...` tagged template literal code", () => {
    const tsxPath = join(currentDir, "./tsxView.tsx");
    const tsxCode = readFileSync(tsxPath, "utf-8");

    // Assert raw file contains genuine JSX element tags, NOT html tagged template literals
    expect(tsxCode).toContain('<div id="tsx-card" className="card">');
    expect(tsxCode).not.toContain("html`");

    // Run jsx2ttl on the TSX source code
    const transpiled = transformJsxToLiveViewHtml(tsxCode);
    expect(transpiled).toContain('import { html } from "@liveviewjs/core";');
    expect(transpiled).toContain("${this.count}");
  });

  test("2. HTTP GET renders page generated from genuine TSX JSX tags in ./tsxView.tsx", async () => {
    const res = await fetch(`${baseUrl}/tsx-counter`);
    expect(res.status).toBe(200);

    const htmlText = await res.text();
    expect(htmlText).toContain("⚡ Real TSX File LiveView Counter");
    expect(htmlText).toContain('<div id="count-val" class="count-display">10</div>');
    expect(htmlText).toContain('phx-click="inc"');
  });

  test("3. Real-time WebSocket join & event diff execution with genuine TSX component from ./tsxView.tsx", async () => {
    const pageRes = await fetch(`${baseUrl}/tsx-counter`);
    const pageHtml = await pageRes.text();
    
    const sessionMatch = pageHtml.match(/data-phx-session="([^"]+)"/);
    const sessionToken = sessionMatch![1];
    const csrfMatch = pageHtml.match(/name="csrf-token"\s+content="([^"]+)"/);
    const csrfToken = csrfMatch![1];

    const wsUrl = `ws://localhost:${server.port}/live/websocket?_csrf_token=${csrfToken}&v=2.0.0`;
    const ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      let step = 0;

      ws.onopen = () => {
        const joinMsg = [
          "1",
          "1",
          "lv:phx-TSX-FILE",
          "phx_join",
          {
            url: `${baseUrl}/tsx-counter`,
            params: { _csrf_token: csrfToken },
            session: sessionToken,
            static: "",
          },
        ];
        ws.send(JSON.stringify(joinMsg));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        
        if (step === 0 && msg[3] === "phx_reply" && msg[4]?.response?.rendered) {
          step = 1;
          const rendered = msg[4].response.rendered;
          
          expect(rendered["r"]).toBe(1);
          // Nested element slot 1 contains count dynamic slot 0:
          expect(rendered["1"]["0"]).toBe("10");

          const incMsg = [
            "1",
            "2",
            "lv:phx-TSX-FILE",
            "event",
            { type: "click", event: "inc", value: {} },
          ];
          ws.send(JSON.stringify(incMsg));
        } else if (step === 1 && msg[3] === "phx_reply" && msg[4]?.response?.diff) {
          const diff = msg[4].response.diff;
          
          expect(diff["s"]).toBeUndefined();
          // Diff payload updates count inside child slot 1:
          expect(diff["1"]["0"]).toBe("11");

          ws.close();
          resolve();
        }
      };

      ws.onerror = (err) => reject(err);
    });
  });
});
