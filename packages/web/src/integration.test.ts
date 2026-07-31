import { describe, test, expect, afterAll, beforeAll } from "bun:test";
import { WebLiveViewHandler } from "./webLiveViewHandler";
import { createLiveView, html } from "@liveviewjs/core";

/**
 * Empirical Runtime Integration Test Suite for @liveviewjs/web
 * 
 * Launches a real local Bun.serve HTTP & WebSocket server over TCP, 
 * makes real HTTP requests via fetch(), and connects a real WebSocket client 
 * to verify end-to-end HTML rendering and Phoenix 5-tuple protocol diff frames.
 */
describe("End-to-End Local Server & WebSocket Integration Suite", () => {
  let server: any;
  let serverPort: number;

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
    signingSecret: "integration-test-secret-1234567890",
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

  test("1. Real HTTP GET request renders initial 200 OK HTML page with LiveView contents and CSRF token", async () => {
    const url = `http://localhost:${serverPort}/counter`;
    const response = await fetch(url);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const htmlText = await response.text();
    expect(htmlText).toContain('<div id="counter">Count: 10</div>');
    expect(htmlText).toContain('meta name="csrf-token"');
    expect(htmlText).toContain('data-phx-session=');
  });

  test("2. Real WebSocket TCP connection joins channel at /live/websocket and receives live diff frames", async () => {
    // Official Phoenix LiveView WebSocket endpoint path: /live/websocket
    const wsUrl = `ws://localhost:${serverPort}/live/websocket`;
    const ws = new WebSocket(wsUrl);

    // Promise waiting for real WebSocket open
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = (err) => reject(err);
    });

    const receivedFrames: any[] = [];

    // Attach message listener for 5-tuple replies
    ws.onmessage = (event) => {
      receivedFrames.push(JSON.parse(event.data));
    };

    const csrfToken = "test-csrf-token-123456";
    const sessionData = { _csrf_token: csrfToken };
    const serializedSession = JSON.stringify(sessionData);

    // 1. Send real phx_join frame over real WebSocket
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

    // Wait for phx_reply frame
    await new Promise((r) => setTimeout(r, 100));

    expect(receivedFrames.length).toBe(1);
    const joinReply = receivedFrames[0];
    expect(joinReply[0]).toBe("1");
    expect(joinReply[1]).toBe("1");
    expect(joinReply[2]).toBe("lv:phx-Test123");
    expect(joinReply[3]).toBe("phx_reply");
    expect(joinReply[4].status).toBe("ok");
    expect(joinReply[4].response.rendered["0"]).toBe("10");

    // 2. Send real 'inc' event frame over real WebSocket
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

    // Wait for event reply frame
    await new Promise((r) => setTimeout(r, 100));

    expect(receivedFrames.length).toBe(2);
    const eventReply = receivedFrames[1];
    expect(eventReply[1]).toBe("2");
    expect(eventReply[3]).toBe("phx_reply");
    expect(eventReply[4].response.diff).toEqual({
      "0": "11",
    });

    ws.close();
  });
});
