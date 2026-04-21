import type { Color } from '../../types';
import type { ColorPin } from './ColorPinState';
import { sortByColorSimilarity } from '../../utils/sortByColorSimilarity';

function pinToColor(p: ColorPin): Color {
  return {
    id: p.id,
    hex: p.color,
    locked: false,
    ratio: 0,
    mixRecipe: '',
  };
}

/**
 * Legacy `useSortPalette` policy: for each group (in `groups` order), sort pins in that group by perceptual
 * similarity; then sort remaining “ungrouped” pins (no assignment, or assignment points at a missing group id).
 */
export function orderedPinIdsByColorSimilarity(
  pins: readonly ColorPin[],
  groups: readonly { readonly id: string }[],
  assignments: Readonly<Record<string, string>>,
): readonly string[] {
  if (pins.length === 0) {
    return [];
  }

  const groupIdSet = new Set(groups.map((g) => g.id));

  const pinsInGroup = (groupId: string): ColorPin[] =>
    pins.filter((p) => assignments[p.id] === groupId);

  const ungroupedPins: ColorPin[] = pins.filter(
    (p) => !assignments[p.id] || !groupIdSet.has(assignments[p.id]!),
  );

  const ids: string[] = [];
  for (const g of groups) {
    const subset = pinsInGroup(g.id);
    if (subset.length === 0) {
      continue;
    }
    ids.push(...sortByColorSimilarity(subset.map(pinToColor)).map((c) => c.id));
  }
  ids.push(...sortByColorSimilarity(ungroupedPins.map(pinToColor)).map((c) => c.id));
  return ids;
}
