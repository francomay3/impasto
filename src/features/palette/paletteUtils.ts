import type { Color, ColorGroup } from '../../types';

export function createGroupEntry(count: number): { id: string; name: string } {
  return { id: crypto.randomUUID(), name: `Group ${count + 1}` };
}

export function getUngroupedColors(palette: Color[], groups: ColorGroup[]): Color[] {
  return palette.filter((c) => !c.groupId || !groups.find((g) => g.id === c.groupId));
}
