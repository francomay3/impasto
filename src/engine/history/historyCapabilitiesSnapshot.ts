import type { HistoryManager } from './HistoryManager';

export type HistoryCapabilities = { canUndo: boolean; canRedo: boolean };

const snapshotCache = new WeakMap<HistoryManager, HistoryCapabilities>();

/**
 * Returns a cached `{ canUndo, canRedo }` object while values are unchanged — required for
 * `useSyncExternalStore` consumers (React compares snapshot by reference).
 */
export function readHistoryCapabilities(history: HistoryManager): HistoryCapabilities {
  const canUndo = history.canUndo();
  const canRedo = history.canRedo();
  const prev = snapshotCache.get(history);
  if (prev && prev.canUndo === canUndo && prev.canRedo === canRedo) {
    return prev;
  }
  const next: HistoryCapabilities = { canUndo, canRedo };
  snapshotCache.set(history, next);
  return next;
}
