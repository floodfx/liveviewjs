/**
 * Checks if globalThis has a `structuredClone` function and if not, adds one
 * that uses `JSON.parse(JSON.stringify())` as a fallback.  This is needed
 * for Node version <17.
 */
export function maybeAddStructuredClone() {
  /**
   * Really bad implementation of structured clone algorithm to backfill for
   * Node 16 (and below).
   */
  if (globalThis && !globalThis.structuredClone) {
    globalThis.structuredClone = <T>(
      value: T,
      transfer?:
        | {
            transfer: readonly any[];
          }
        | undefined
    ): T => JSON.parse(JSON.stringify(value));
  }
}
