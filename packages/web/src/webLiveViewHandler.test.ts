import { describe, test, expect } from "bun:test";
import { WebLiveViewHandler } from "./webLiveViewHandler";
import { createLiveView, html } from "@liveviewjs/core";

/**
 * Universal Web Standard WebLiveViewHandler TDD Test Suite
 * 
 * Verifies WinterCG Request/Response & WebSocket handling 
 * across Node 22+, Bun, Deno, and Cloudflare Workers using HotdogJS architecture.
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

  describe("2. WebSocket Protocol Handling (HotdogJS Architecture)", () => {
    test("WebSocket phx_join connects to WsHandler engine and receives phx_reply 5-tuple payload", async () => {
      const sentMessages: string[] = [];
      let onMessageListener: Function | undefined;

      const mockSocket = {
        send: (msg: string) => {
          sentMessages.push(msg);
        },
        addEventListener: (event: string, callback: Function) => {
          if (event === "message") {
            onMessageListener = callback;
          }
        },
      };

      // Initialize WS connection using WebStandardWsAdaptor
      handler.ws(mockSocket, "/counter");

      const csrfToken = "test-csrf-token-123456";
      const sessionData = { _csrf_token: csrfToken };
      const serializedSession = JSON.stringify(sessionData);

      // Client sends phx_join frame
      const phxJoinFrame = JSON.stringify([
        "1",
        "1",
        "lv:phx-Test123",
        "phx_join",
        {
          url: "http://localhost:3000/counter",
          params: { _csrf_token: csrfToken },
          session: serializedSession,
          static: "",
        },
      ]);

      if (onMessageListener) {
        await onMessageListener({ data: phxJoinFrame });
      }

      expect(sentMessages.length).toBeGreaterThan(0);
      const reply = JSON.parse(sentMessages[0]);
      expect(reply[0]).toBe("1");
      expect(reply[1]).toBe("1");
      expect(reply[2]).toBe("lv:phx-Test123");
      expect(reply[3]).toBe("phx_reply");
      expect(reply[4].status).toBe("ok");
      expect(reply[4].response.rendered).toBeDefined();
      expect(reply[4].response.rendered["0"]).toBe("10");

      // Now simulate user triggering 'inc' event over WebSocket
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

      await onMessageListener!({ data: incEventFrame });
      expect(sentMessages.length).toBe(2);
      const eventReply = JSON.parse(sentMessages[1]);
      expect(eventReply[1]).toBe("2");
      expect(eventReply[3]).toBe("phx_reply");
      expect(eventReply[4].response.diff).toEqual({
        "0": "11",
      });
    });
  });
});
