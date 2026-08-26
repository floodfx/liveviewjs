import assert from "node:assert/strict";
import test from "node:test";
import { assertFixtureMatches } from "../src/compare.mjs";

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
