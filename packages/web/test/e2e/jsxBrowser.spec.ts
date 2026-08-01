import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { WebLiveViewHandler } from "../../src/webLiveViewHandler";
import { ClassLiveView, jsx } from "../../../core/src/index";

/**
 * JSX-Based ClassLiveView for E2E Browser & WebSocket Testing
 */
class JsxE2EView extends ClassLiveView<{ count: number; name: string }> {
  count = 10;
  name = "JSX User";

  async mount(socket: any) {
    socket.assign({ count: this.count, name: this.name });
  }

  async handleEvent(event: { type: string }, socket: any) {
    if (event.type === "inc") {
      this.count++;
    }
    socket.assign({ count: this.count });
  }

  async render() {
    // Uses JSX template syntax via jsx() factory
    return jsx(
      "div",
      { id: "jsx-card", class: "card" },
      jsx("h1", null, "⚡ JSX LiveView Counter"),
      jsx("div", { id: "count-val", class: "count-display" }, this.count),
      jsx("button", { id: "inc-btn", phxClick: "inc" }, "+ Increment")
    );
  }
}

describe("E2E Real-Time Engine with JSX Templates", () => {
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

  test("1. HTTP GET renders JSX-based LiveView page", async () => {
    const res = await fetch(`${baseUrl}/jsx-counter`);
    expect(res.status).toBe(200);

    const htmlText = await res.text();
    expect(htmlText).toContain("⚡ JSX LiveView Counter");
    expect(htmlText).toContain('<div id="count-val" class="count-display">10</div>');
    expect(htmlText).toContain('phx-click="inc"');
  });

  test("2. Real-time WebSocket join & event diff execution with JSX template", async () => {
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
          
          // Verify Optimization #7 root annotation on JSX template
          expect(rendered["r"]).toBe(1);
          expect(rendered["1"]["0"]).toBe("10");

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
          
          // Verify diff payload updates count from 10 to 11
          expect(diff["s"]).toBeUndefined();
          expect(diff["1"]["0"]).toBe("11");

          ws.close();
          resolve();
        }
      };

      ws.onerror = (err) => reject(err);
    });
  });
});
