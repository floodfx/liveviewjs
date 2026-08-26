import assert from "node:assert/strict";
import test from "node:test";
import { binaryRecord, normalizeTrace } from "../src/normalize.mjs";

test("normalization preserves structure and correlation while replacing nondeterminism", () => {
  const normalized = normalizeTrace({
    schemaVersion: 1,
    scenarioId: "protocol.lifecycle.basic",
    capabilityId: "protocol.client-interoperability",
    metadata: { seed: 182 },
    http: {
      request: { url: "http://127.0.0.1:4102/example", headers: { "user-agent": "platform-specific" } },
      response: { headers: { date: "Tue, 25 Aug 2026 00:00:00 GMT", "set-cookie": "sid=secret; Path=/; HttpOnly" } },
      cookies: [{ name: "sid", cookieValue: "secret" }],
    },
    webSocket: {
      url: "ws://127.0.0.1:4102/live/websocket?_csrf_token=csrf&_track_static=http%3A%2F%2Flocalhost%3A4102%2Fapp.js",
      events: [
        { direction: "client-to-server", encoding: "text", payload: ["7", "9", "lv:phx-random", "phx_join", { session: "signed", _csrf_token: "csrf" }] },
        { direction: "server-to-client", encoding: "text", payload: ["7", "9", "lv:phx-random", "phx_reply", { status: "ok" }] },
      ],
    },
    domCheckpoints: [{ name: "connected", dom: '<meta name="csrf-token" content="csrf"><div id="phx-random" data-phx-session="signed"></div>' }],
  });

  assert.equal(normalized.http.request.url, "http://HOST:PORT/example");
  assert.equal(normalized.http.request.headers["user-agent"], "BROWSER_USER_AGENT_1");
  assert.equal(normalized.http.response.headers.date, "TIMESTAMP_1");
  assert.equal(normalized.webSocket.events[0].payload[0], "JOIN_1");
  assert.equal(normalized.webSocket.events[1].payload[0], "JOIN_1");
  assert.equal(normalized.webSocket.events[0].payload[1], "REF_1");
  assert.equal(normalized.webSocket.events[1].payload[1], "REF_1");
  assert.equal(normalized.webSocket.events[0].payload[2], "lv:VIEW_1");
  assert.equal(normalized.webSocket.events[1].payload[2], "lv:VIEW_1");
  assert.match(normalized.domCheckpoints[0].dom, /CSRF_1/);
  assert.match(normalized.domCheckpoints[0].dom, /SESSION_1/);
  assert.match(normalized.domCheckpoints[0].dom, /VIEW_1/);
  assert.equal(
    normalized.webSocket.url,
    "ws://HOST:PORT/live/websocket?_csrf_token=CSRF_1&_track_static=http%3A%2F%2FHOST%3APORT%2Fapp.js",
  );
});

test("binary frames preserve their encoding, byte length, and content hash", () => {
  assert.deepEqual(binaryRecord(Buffer.from([0, 1, 2])), {
    encoding: "binary",
    length: 3,
    sha256: "ae4b3280e56e2faf83f414a6e3dabe9d5fbe18976544c05fed121accb85b53fc",
  });
});
