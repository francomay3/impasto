import type { FilterInstance } from '../../types';

export function cloneFilterSnapshot(filters: readonly FilterInstance[]): FilterInstance[] {
  return structuredClone(filters) as FilterInstance[];
}

export function filterSnapshotsEqual(a: readonly FilterInstance[], b: readonly FilterInstance[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
