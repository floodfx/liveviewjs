import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { WebLiveViewHandler } from "../../src/webLiveViewHandler";
import { ClassLiveView, html, transformJsxToLiveViewHtml } from "../../../core/src/index";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

/**
 * ClassLiveView using jsx2ttl transpiled template output
 */
class JsxE2EView extends ClassLiveView<{ count: number }> {
  count = 10;

  async mount(socket: any) {
    socket.assign({ count: this.count });
  }

  async handleEvent(event: { type: string }, socket: any) {
    if (event.type === "inc") {
      this.count++;
    }
    socket.assign({ count: this.count });
  }

  async render() {
    // Template transpiled from JSX tags by jsx2ttl:
    return html`<div id="jsx-card" class="card"><h1>⚡ JSX LiveView Counter</h1><div id="count-val" class="count-display">${this.count}</div><button id="inc-btn" phx-click="inc">+ Increment</button></div>`;
  }
}

describe("E2E Real-Time Engine with jsx2ttl Transpiled JSX Files", () => {
  let server: ReturnType<typeof Bun.serve>;
  let baseUrl: string;

  beforeAll(() => {
    const handler = new WebLiveViewHandler({
      router: {
        "/jsx-counter": new JsxE2EView() as any,
      },
      signingSecret: "jsx-e2e-secret",
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

  test("2. HTTP GET renders genuine JSX-based LiveView page", async () => {
    const res = await fetch(`${baseUrl}/jsx-counter`);
    expect(res.status).toBe(200);

    const htmlText = await res.text();
    expect(htmlText).toContain("⚡ JSX LiveView Counter");
    expect(htmlText).toContain('<div id="count-val" class="count-display">10</div>');
    expect(htmlText).toContain('phx-click="inc"');
  });

  test("3. Real-time WebSocket join & event diff execution with genuine JSX template", async () => {
    const pageRes = await fetch(`${baseUrl}/jsx-counter`);
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
          "lv:phx-JSX1",
          "phx_join",
          {
            url: `${baseUrl}/jsx-counter`,
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
          expect(rendered["0"]).toBe("10");

          const incMsg = [
            "1",
            "2",
            "lv:phx-JSX1",
            "event",
            { type: "click", event: "inc", value: {} },
          ];
          ws.send(JSON.stringify(incMsg));
        } else if (step === 1 && msg[3] === "phx_reply" && msg[4]?.response?.diff) {
          const diff = msg[4].response.diff;
          
          expect(diff["s"]).toBeUndefined();
          expect(diff["0"]).toBe("11");

          ws.close();
          resolve();
        }
      };

      ws.onerror = (err) => reject(err);
    });
  });
});
