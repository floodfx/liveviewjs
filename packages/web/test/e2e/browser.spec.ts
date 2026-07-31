import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { WebLiveViewHandler } from "../../src/webLiveViewHandler";
import { ClassLiveView, html } from "../../../core/src/index";

/**
 * Class-Based Counter View for E2E Browser Testing
 */
class CounterE2EView extends ClassLiveView<{ count: number }> {
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
    return html`
      <div id="counter-card" class="card">
        <h1>⚡ Class LiveView Counter</h1>
        <div id="count-value" class="count-display">${this.count}</div>
        <button id="inc-btn" phx-click="inc">+ Increment</button>
      </div>
    `;
  }
}

describe("E2E Browser & Real-Time Engine Test Suite", () => {
  let server: ReturnType<typeof Bun.serve>;
  let baseUrl: string;

  beforeAll(() => {
    const handler = new WebLiveViewHandler({
      router: {
        "/counter": new CounterE2EView() as any,
      },
      signingSecret: "e2e-secret-key",
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

  test("1. HTTP GET renders class-based view page with CSRF token and data-phx-session", async () => {
    const res = await fetch(`${baseUrl}/counter`);
    expect(res.status).toBe(200);

    const htmlText = await res.text();
    expect(htmlText).toContain("⚡ Class LiveView Counter");
    expect(htmlText).toContain('<div id="count-value" class="count-display">10</div>');
    expect(htmlText).toContain('data-phx-session="');
  });

  test("2. WebSocket join and inc event live diff execution", async () => {
    const pageRes = await fetch(`${baseUrl}/counter`);
    const pageHtml = await pageRes.text();
    
    // Extract data-phx-session token
    const sessionMatch = pageHtml.match(/data-phx-session="([^"]+)"/);
    expect(sessionMatch).not.toBeNull();
    const sessionToken = sessionMatch![1];

    // Extract CSRF token from meta tag
    const csrfMatch = pageHtml.match(/name="csrf-token"\s+content="([^"]+)"/);
    expect(csrfMatch).not.toBeNull();
    const csrfToken = csrfMatch![1];

    const wsUrl = `ws://localhost:${server.port}/live/websocket?_csrf_token=${csrfToken}&v=2.0.0`;
    const ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => {
        // Send phx_join message
        const joinMsg = [
          "1",
          "1",
          "lv:phx-E2E123",
          "phx_join",
          {
            url: `${baseUrl}/counter`,
            params: { _csrf_token: csrfToken },
            session: sessionToken,
            static: "",
          },
        ];
        ws.send(JSON.stringify(joinMsg));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        // Message index 3 is event type ("phx_reply")
        if (msg[3] === "phx_reply" && msg[4]?.response?.rendered) {
          const rendered = msg[4].response.rendered;
          expect(rendered["0"]).toBe("10"); // Counter initial value

          // Now send click increment event
          const incEventMsg = [
            "1",
            "2",
            "lv:phx-E2E123",
            "event",
            { type: "click", event: "inc", value: {} },
          ];
          ws.send(JSON.stringify(incEventMsg));
        } else if (msg[3] === "phx_reply" && msg[4]?.response?.diff) {
          const diff = msg[4].response.diff;
          expect(diff["0"]).toBe("11"); // Diff patch updated value to 11!
          ws.close();
          resolve();
        }
      };

      ws.onerror = (err) => reject(err);
    });
  });
});
