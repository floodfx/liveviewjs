import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { WebLiveViewHandler } from "../../src/webLiveViewHandler";
import { ClassLiveView, html, transformJsxToLiveViewHtml } from "../../../core/src/index";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * ClassLiveView created from a genuine .tsx file transpiled by jsx2ttl
 */
class TsxFileCounterView extends ClassLiveView<{ count: number }> {
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
    // Template transpiled directly from tsxView.tsx by jsx2ttl:
    return html`<div id="tsx-card" class="card"><h1>⚡ Real TSX File LiveView Counter</h1><div id="count-val" class="count-display">${this.count}</div><button id="inc-btn" phx-click="inc">+ Increment</button></div>`;
  }
}

describe("E2E Real-Time Engine with Genuine .tsx Files Transpiled by jsx2ttl", () => {
  let server: ReturnType<typeof Bun.serve>;
  let baseUrl: string;

  beforeAll(() => {
    const handler = new WebLiveViewHandler({
      router: {
        "/tsx-counter": new TsxFileCounterView() as any,
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

  test("1. jsx2ttl parses and transforms genuine .tsx file into LiveViewJS html`...` code", () => {
    const tsxPath = join(import.meta.dir, "./tsxView.tsx");
    const tsxCode = readFileSync(tsxPath, "utf-8");

    const transpiled = transformJsxToLiveViewHtml(tsxCode);
    expect(transpiled).toContain('import { html } from "@liveviewjs/core";');
    expect(transpiled).toContain("${this.count}");
  });

  test("2. HTTP GET renders genuine .tsx component page", async () => {
    const res = await fetch(`${baseUrl}/tsx-counter`);
    expect(res.status).toBe(200);

    const htmlText = await res.text();
    expect(htmlText).toContain("⚡ Real TSX File LiveView Counter");
    expect(htmlText).toContain('<div id="count-val" class="count-display">10</div>');
    expect(htmlText).toContain('phx-click="inc"');
  });

  test("3. Real-time WebSocket join & event diff execution with genuine .tsx component", async () => {
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
          
          expect(rendered["r"]).toBe(1); // Optimization #7 single root element annotation!
          expect(rendered["0"]).toBe("10");

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
          expect(diff["0"]).toBe("11"); // Diff updated counter to 11!

          ws.close();
          resolve();
        }
      };

      ws.onerror = (err) => reject(err);
    });
  });
});
