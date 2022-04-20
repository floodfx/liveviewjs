/**
 * Add structuredClone type until makes it to latest @types/node
 * See: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/59434/files
 */
declare function structuredClone<T>(
  value: T,
  transfer?: { transfer: ReadonlyArray<import("worker_threads").TransferListItem> }
): T;
