import type { FilterInstance } from '../types';

export function swapFilters(filters: FilterInstance[], a: number, b: number): FilterInstance[] {
  const next = [...filters];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
