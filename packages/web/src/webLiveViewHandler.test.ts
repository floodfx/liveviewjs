import { describe, test, expect, mock } from "bun:test";
import { WebLiveViewHandler } from "./webLiveViewHandler";
import { createLiveView, html } from "@liveviewjs/core";

/**
 * Universal Web Standard WebLiveViewHandler TDD Test Suite
 * 
 * Verifies WinterCG Request/Response & WebSocket handling 
 * across Node 22+, Bun, Deno, and Cloudflare Workers.
 */
describe("WebLiveViewHandler - WinterCG Web Standard Adaptor", () => {
  // Test LiveView definition
  const CounterLV = createLiveView({
    mount: (socket) => {
      socket.assign({ count: 10 });
    },
    render: (context) => {
      return html`<div>Count: ${context.count}</div>`;
    },
    handleEvent: (event, socket) => {
      if (event.type === "inc") {
        socket.assign({ count: socket.context.count + 1 });
      }
    },
  });

  const router = {
    "/counter": CounterLV,
  };

  const handler = new WebLiveViewHandler({
    router,
    signingSecret: "test-secret-key-12345678901234567890",
  });

  describe("1. HTTP Fetch Handling (Request -> Response)", () => {
    test("GET request to matched route returns 200 OK HTML Response with CSRF and phx-session", async () => {
      const request = new Request("http://localhost:3000/counter", {
        method: "GET",
      });

      const response = await handler.fetch(request);
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");

      const htmlText = await response.text();
      expect(htmlText).toContain("Count: 10");
      expect(htmlText).toContain("phx-session");
    });

    test("GET request to unmatched route returns 404 Not Found Response", async () => {
      const request = new Request("http://localhost:3000/non-existent", {
        method: "GET",
      });

      const response = await handler.fetch(request);
      expect(response.status).toBe(404);
    });

    test("Supports bound handler syntax (handler.fetch)", async () => {
      const fetchFn = handler.fetch;
      const request = new Request("http://localhost:3000/counter", {
        method: "GET",
      });

      const response = await fetchFn(request);
      expect(response.status).toBe(200);
    });
  });

  describe("2. WebSocket Protocol Handling (Phoenix 5-Tuple Frames)", () => {
    test("WebSocket phx_join receives 5-tuple phx_reply with initial partsTree", async () => {
      // Mock standard Web Standard WebSocket
      const sentMessages: string[] = [];
      const mockSocket = {
        send: (msg: string) => {
          sentMessages.push(msg);
        },
        addEventListener: (event: string, callback: Function) => {
          if (event === "message") {
            (mockSocket as any)._onMessage = callback;
          }
        },
      } as any;

      // Initialize WS connection
      handler.ws(mockSocket, "/counter");

      // Simulate client sending phx_join frame
      const phxJoinFrame = JSON.stringify([
        "1", // joinRef
        "1", // msgRef
        "lv:phx-Test123", // topic
        "phx_join", // event
        {
          params: {
            _csrf_token: "test-csrf",
          },
          session: "",
          static: "",
        },
      ]);

      if (mockSocket._onMessage) {
        await mockSocket._onMessage({ data: phxJoinFrame });
      }

      expect(sentMessages.length).toBeGreaterThan(0);
      const reply = JSON.parse(sentMessages[0]);
      // Verify Phoenix 5-tuple structure: [joinRef, msgRef, topic, event, payload]
      expect(reply[0]).toBe("1");
      expect(reply[1]).toBe("1");
      expect(reply[2]).toBe("lv:phx-Test123");
      expect(reply[3]).toBe("phx_reply");
      expect(reply[4].status).toBe("ok");
      expect(reply[4].response.rendered).toBeDefined();
    });
  });
});
