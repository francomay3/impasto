import type { FilterInstance } from '../types';

/** First index where the filter chain differs, else `min(prev.length, next.length)` when prefixes match. */
export function findDirtyFilterIndex(prev: FilterInstance[], next: FilterInstance[]): number {
  let dirtyIndex = Math.min(prev.length, next.length);
  for (let i = 0; i < dirtyIndex; i++) {
    if (
      prev[i].type !== next[i].type ||
      JSON.stringify(prev[i].params) !== JSON.stringify(next[i].params)
    ) {
      dirtyIndex = i;
      break;
    }
  }
  return dirtyIndex;
}

/** True when both chains are identical (type + params per step). */
export function filterChainsEqual(a: FilterInstance[], b: FilterInstance[]): boolean {
  if (a.length !== b.length) return false;
  return findDirtyFilterIndex(a, b) === a.length;
}
