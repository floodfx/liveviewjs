import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { WebLiveViewHandler } from "../../src/webLiveViewHandler";
import { ClassLiveView, html } from "../../../core/src/index";

/**
 * Advanced Class-Based LiveView for E2E API & Edge Case Testing
 */
class AdvancedE2EView extends ClassLiveView<{ count: number; name: string }> {
  count = 10;
  name = "Anonymous";

  async mount(socket: any) {
    socket.assign({ count: this.count, name: this.name });
  }

  async handleEvent(event: { type: string; name?: string }, socket: any) {
    if (event.type === "inc") {
      this.count++;
    } else if (event.type === "submit_name" && event.name) {
      this.name = event.name;
    }
    socket.assign({ count: this.count, name: this.name });
  }

  async render() {
    return html`
      <div id="counter-card" class="card">
        <h1>⚡ Class LiveView Counter</h1>
        <div id="count-value" class="count-display">${this.count}</div>
        <div id="user-name">${this.name}</div>
        <button id="inc-btn" phx-click="inc">+ Increment</button>
      </div>
    `;
  }
}

describe("E2E Browser & Real-Time Engine Advanced API Coverage", () => {
  let server: ReturnType<typeof Bun.serve>;
  let baseUrl: string;

  beforeAll(() => {
    const handler = new WebLiveViewHandler({
      router: {
        "/counter": new AdvancedE2EView() as any,
      },
      signingSecret: "e2e-advanced-secret",
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

  test("1. HTTP GET renders class-based view page with CSRF token and signed data-phx-session", async () => {
    const res = await fetch(`${baseUrl}/counter`);
    expect(res.status).toBe(200);

    const htmlText = await res.text();
    expect(htmlText).toContain("⚡ Class LiveView Counter");
    expect(htmlText).toContain('<div id="count-value" class="count-display">10</div>');
    expect(htmlText).toContain('data-phx-session="');
  });

  test("2. Real-time WebSocket join, heartbeat, event diff, form submit, and phx_leave execution", async () => {
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
      let step = 0;

      ws.onopen = () => {
        // Step 1: Send phx_join message
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
        
        if (step === 0 && msg[3] === "phx_reply" && msg[4]?.response?.rendered) {
          step = 1;
          const rendered = msg[4].response.rendered;
          expect(rendered["0"]).toBe("10"); // Counter initial value

          // Step 2: Send Heartbeat message
          const hbMsg = [null, "2", "phoenix", "heartbeat", {}];
          ws.send(JSON.stringify(hbMsg));
        } else if (step === 1 && msg[3] === "phx_reply" && msg[1] === "2") {
          step = 2;
          expect(msg[4]?.status).toBe("ok"); // Heartbeat ACK!

          // Step 3: Send Click Increment event
          const incEventMsg = [
            "1",
            "3",
            "lv:phx-E2E123",
            "event",
            { type: "click", event: "inc", value: {} },
          ];
          ws.send(JSON.stringify(incEventMsg));
        } else if (step === 2 && msg[3] === "phx_reply" && msg[4]?.response?.diff) {
          step = 3;
          const diff = msg[4].response.diff;
          expect(diff["0"]).toBe("11"); // Diff updated counter to 11

          // Step 4: Send Form Submit event
          const formEventMsg = [
            "1",
            "4",
            "lv:phx-E2E123",
            "event",
            { type: "form", event: "submit_name", value: { name: "Alice" } },
          ];
          ws.send(JSON.stringify(formEventMsg));
        } else if (step === 3 && msg[3] === "phx_reply" && msg[4]?.response?.diff) {
          step = 4;
          const diff = msg[4].response.diff;
          expect(diff["1"]).toBe("Alice"); // Form submit updated name to Alice

          // Step 5: Send phx_leave disconnect message
          const leaveMsg = ["1", "5", "lv:phx-E2E123", "phx_leave", {}];
          ws.send(JSON.stringify(leaveMsg));
          
          ws.close();
          resolve();
        }
      };

      ws.onerror = (err) => reject(err);
    });
  });
});
