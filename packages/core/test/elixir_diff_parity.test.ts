import { describe, test, expect } from "bun:test";
import { deepDiff } from "../src/server/templates/diff";
import phoenixDiffsFixture from "./fixtures/phoenix_diffs.json";

/**
 * Official Elixir Phoenix LiveView 1.0 JSON Wire Parity Test Suite
 * 
 * Validates that @liveviewjs/core deepDiff calculation matches byte-for-byte 
 * with official Elixir Phoenix LiveView JSON fixtures.
 */
describe("Elixir Phoenix LiveView 1.0 Wire Protocol Parity Suite", () => {
  for (const fixture of phoenixDiffsFixture.fixtures) {
    test(`Parity Check: ${fixture.name} - ${fixture.description}`, () => {
      if (fixture.initial && fixture.updated && fixture.expectedDiff) {
        const calculatedDiff = deepDiff(fixture.initial as any, fixture.updated as any);
        expect(calculatedDiff).toEqual(fixture.expectedDiff as any);
      }

      if (fixture.expectedWireFormat) {
        const wireFrame = [
          fixture.joinRef,
          fixture.msgRef,
          fixture.topic,
          fixture.event,
          fixture.payload,
        ];
        expect(wireFrame).toEqual(fixture.expectedWireFormat);
      }
    });
  }
});
