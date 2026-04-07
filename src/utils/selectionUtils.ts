import type { Color, ColorGroup } from '../types';

interface SelectionState {
  canMerge: boolean;
  allHidden: boolean;
  currentGroupId: string | null;
}

export function getSelectionState(
  ids: string[],
  palette: Color[],
  hiddenPinIds: Set<string>
): SelectionState {
  const canMerge = ids.length === 2 && ids.every((id) => palette.find((c) => c.id === id)?.sample != null);
  const allHidden = ids.every((id) => hiddenPinIds.has(id));
  const groupIds = [...new Set(ids.map((id) => palette.find((c) => c.id === id)?.groupId))];
  const currentGroupId = groupIds.length === 1 ? (groupIds[0] ?? '__none__') : null;
  return { canMerge, allHidden, currentGroupId };
}

export function buildGroupOptions(groups: ColorGroup[]): { value: string; label: string }[] {
  return [
    { value: '__none__', label: 'No group' },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];
}
