/**
 * Checks if globalThis has a `structuredClone` function and if not, adds one
 * that uses `JSON.parse(JSON.stringify())` as a fallback.
 */
export function maybeAddStructuredClone() {
  if (typeof globalThis !== "undefined" && !globalThis.structuredClone) {
    (globalThis as any).structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
  }
}
