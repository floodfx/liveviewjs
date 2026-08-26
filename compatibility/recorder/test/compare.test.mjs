import assert from "node:assert/strict";
import test from "node:test";
import {
  assertBrowserOutcomesMatch,
  assertFixtureMatches,
  assertProtocolLifecycleMatches,
} from "../src/compare.mjs";

test("a deliberate protocol regression identifies the failing frame field", () => {
  const expected = {
    webSocket: { events: [{ payload: ["JOIN_1", "REF_1", "lv:VIEW_1", "phx_reply", { status: "ok" }] }] },
  };
  const regressed = structuredClone(expected);
  regressed.webSocket.events[0].payload[4].status = "error";

  assert.throws(
    () => assertFixtureMatches(regressed, expected, "protocol.lifecycle.basic"),
    /protocol\.lifecycle\.basic at trace\.webSocket\.events\[0\]\.payload\[4\]\.status/,
  );
});

test("an identical normalized fixture passes", () => {
  const trace = { http: { response: { status: 200 } }, webSocket: { events: [] } };
  assert.doesNotThrow(() => assertFixtureMatches(structuredClone(trace), trace, "protocol.lifecycle.basic"));
});

test("JSON object member order is not treated as protocol ordering", () => {
  const actual = { response: { rendered: {}, liveview_version: "1.2.9" } };
  const expected = { response: { liveview_version: "1.2.9", rendered: {} } };
  assert.doesNotThrow(() => assertFixtureMatches(actual, expected, "protocol.lifecycle.basic"));
});

test("differential comparison ignores implementation DOM while requiring browser outcome parity", () => {
  const oracle = [{ name: "after-increment", dom: "<div>phoenix</div>", outcome: { count: "1" } }];
  const liveViewJs = [{ name: "after-increment", dom: "<main>liveviewjs</main>", outcome: { count: "1" } }];

  assert.doesNotThrow(() => assertBrowserOutcomesMatch(liveViewJs, oracle, "protocol.lifecycle.basic"));
  liveViewJs[0].outcome.count = "0";
  assert.throws(
    () => assertBrowserOutcomesMatch(liveViewJs, oracle, "protocol.lifecycle.basic"),
    /browser outcome drift: protocol\.lifecycle\.basic at outcomes\[0\]\.outcome\.count/,
  );
});

test("differential protocol comparison requires correlated lifecycle envelopes", () => {
  const oracle = [
    { type: "open" },
    { direction: "client-to-server", payload: ["JOIN_1", "REF_1", "lv:VIEW_1", "event", { event: "increment", type: "click", value: { value: "" } }] },
    { direction: "server-to-client", payload: ["JOIN_1", "REF_1", "lv:VIEW_1", "phx_reply", { status: "ok", response: { diff: { 0: "1" } } }] },
    { type: "close" },
  ];
  const liveViewJs = structuredClone(oracle);

  assert.doesNotThrow(() => assertProtocolLifecycleMatches(liveViewJs, oracle, "protocol.lifecycle.basic"));
  liveViewJs[2].payload[4].response.diff = { 0: "regressed" };
  assert.throws(
    () => assertProtocolLifecycleMatches(liveViewJs, oracle, "protocol.lifecycle.basic"),
    /protocol lifecycle drift: protocol\.lifecycle\.basic at protocolLifecycle\[2\]\.payload\.tree\.0/,
  );
});
