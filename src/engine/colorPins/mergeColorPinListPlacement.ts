import type { ColorPin } from './ColorPinState';

/** Minimal group row shape for merge `groupId` resolution (list order matches palette UI). */
export type ColorPinGroupOrderRef = { readonly id: string };

/**
 * After removing merged pins, inserts the new merged row at a stable list index derived from the mean engine index
 * of the sources, shifted left by how many removed pins sat strictly before that mean (keeps ordering intuitive
 * when merging non-contiguous rows).
 */
export function computeMergedPinInsertIndex(
  beforeLength: number,
  mergedEngineIndices: readonly number[],
): number {
  const valid = mergedEngineIndices.filter((i) => Number.isInteger(i) && i >= 0 && i < beforeLength);
  if (valid.length === 0) {
    return 0;
  }
  const meanRaw = valid.reduce((a, b) => a + b, 0) / valid.length;
  const meanIdx = Math.max(0, Math.min(beforeLength - 1, Math.round(meanRaw)));
  const below = valid.filter((i) => i < meanIdx).length;
  const insert = meanIdx - below;
  const afterLen = beforeLength - valid.length;
  return Math.max(0, Math.min(insert, afterLen));
}

/**
 * When every merged pin belonged to the same persisted `groupId` and that id still exists in the sidebar group list,
 * the new pin inherits the group; otherwise the merge is treated as cross-group and stays ungrouped.
 */
export function resolveGroupIdAfterPinMerge(
  pins: readonly ColorPin[],
  groupsOrdered: readonly ColorPinGroupOrderRef[],
): string | undefined {
  const gids = pins.map((p) => p.groupId).filter((g): g is string => typeof g === 'string' && g.length > 0);
  if (gids.length !== pins.length) {
    return undefined;
  }
  const first = gids[0]!;
  if (!gids.every((g) => g === first)) {
    return undefined;
  }
  const valid = new Set(groupsOrdered.map((g) => g.id));
  return valid.has(first) ? first : undefined;
}
