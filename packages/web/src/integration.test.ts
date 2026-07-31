import { describe, test, expect, afterAll, beforeAll } from "bun:test";
import { WebLiveViewHandler } from "./webLiveViewHandler";
import { createLiveView, html, JwtSerDe } from "@liveviewjs/core";
import { Hono } from "hono";

/**
 * Empirical Runtime Integration Test Suite for @liveviewjs/web
 * 
 * Verifies end-to-end rendering across:
 * 1. Bun.serve (HTTP + WebSockets)
 * 2. Hono Framework (HTTP route dispatch)
 * 3. Cloudflare Workers (WinterCG fetch event dispatch)
 */
describe("End-to-End Multi-Runtime Integration Suite (Bun, Hono, Cloudflare Workers)", () => {
  let server: any;
  let serverPort: number;

  const secret = "integration-test-secret-1234567890";
  const jwtSerDe = new JwtSerDe(secret);

  const CounterLV = createLiveView({
    mount: (socket) => {
      socket.assign({ count: 10 });
    },
    render: (context) => {
      return html`<div id="counter">Count: ${context.count}</div>`;
    },
    handleEvent: (event, socket) => {
      if (event.type === "inc") {
        socket.assign({ count: socket.context.count + 1 });
      }
    },
  });

  const handler = new WebLiveViewHandler({
    router: {
      "/counter": CounterLV,
    },
    signingSecret: secret,
  });

  beforeAll(() => {
    // Start real local server in ONE LINE using handler.bun()!
    server = Bun.serve(handler.bun({ port: 0 }));
    serverPort = server.port;
  });

  afterAll(() => {
    if (server) {
      server.stop(true);
    }
  });

  describe("1. Native Bun.serve Server (HTTP + WebSockets)", () => {
    test("Real HTTP GET request renders initial 200 OK HTML page with LiveView contents and CSRF token", async () => {
      const url = `http://localhost:${serverPort}/counter`;
      const response = await fetch(url);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");

      const htmlText = await response.text();
      expect(htmlText).toContain('<div id="counter">Count: 10</div>');
      expect(htmlText).toContain('meta name="csrf-token"');
      expect(htmlText).toContain('data-phx-session=');
    });

    test("Real WebSocket TCP connection joins channel at /live/websocket and receives live diff frames", async () => {
      const wsUrl = `ws://localhost:${serverPort}/live/websocket`;
      const ws = new WebSocket(wsUrl);

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = (err) => reject(err);
      });

      const receivedFrames: any[] = [];
      ws.onmessage = (event) => {
        receivedFrames.push(JSON.parse(event.data));
      };

      const csrfToken = "test-csrf-token-123456";
      const serializedSession = await jwtSerDe.serialize({ _csrf_token: csrfToken });

      const phxJoinFrame = JSON.stringify([
        "1",
        "1",
        "lv:phx-Test123",
        "phx_join",
        {
          url: `http://localhost:${serverPort}/counter`,
          params: { _csrf_token: csrfToken },
          session: serializedSession,
          static: "",
        },
      ]);

      ws.send(phxJoinFrame);
      await new Promise((r) => setTimeout(r, 100));

      expect(receivedFrames.length).toBe(1);
      const joinReply = receivedFrames[0];
      expect(joinReply[4].status).toBe("ok");
      expect(joinReply[4].response.rendered["0"]).toBe("10");

      const incEventFrame = JSON.stringify([
        null,
        "2",
        "lv:phx-Test123",
        "event",
        {
          type: "click",
          event: "inc",
          value: {},
        },
      ]);

      ws.send(incEventFrame);
      await new Promise((r) => setTimeout(r, 100));

      expect(receivedFrames.length).toBe(2);
      const eventReply = receivedFrames[1];
      expect(eventReply[4].response.diff).toEqual({
        "0": "11",
      });

      ws.close();
    });
  });

  describe("2. Hono Framework Integration", () => {
    test("Hono app delegates to WebLiveViewHandler and returns 200 OK HTML", async () => {
      const app = new Hono();
      app.all("*", (c) => handler.fetch(c.req.raw));

      const req = new Request("http://localhost/counter", { method: "GET" });
      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/html");

      const text = await res.text();
      expect(text).toContain('<div id="counter">Count: 10</div>');
      expect(text).toContain('meta name="csrf-token"');
    });
  });

  describe("3. Cloudflare Workers Integration", () => {
    test("Cloudflare Workers fetch handler returns 200 OK HTML", async () => {
      const worker = {
        async fetch(request: Request) {
          return handler.fetch(request);
        },
      };

      const req = new Request("https://my-worker.workers.dev/counter", { method: "GET" });
      const res = await worker.fetch(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/html");

      const text = await res.text();
      expect(text).toContain('<div id="counter">Count: 10</div>');
      expect(text).toContain('data-phx-session=');
    });
  });
});
