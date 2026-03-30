import { arrayMove } from '@dnd-kit/sortable';
import type { Color } from '../../../types';

/**
 * Moves a color from its current position to just before `overId`,
 * adopting `overId`'s group.
 * Used during a live drag-over event to preview cross-group repositioning.
 */
export function movePaletteItemBefore(
  palette: Color[],
  activeId: string,
  overId: string,
): Color[] {
  const activeColor = palette.find(c => c.id === activeId);
  const overColor = palette.find(c => c.id === overId);
  if (!activeColor || !overColor) return palette;
  if (activeColor.groupId === overColor.groupId) return palette;

  const withoutActive = palette.filter(c => c.id !== activeId);
  const overIdx = withoutActive.findIndex(c => c.id === overId);
  const result = [...withoutActive];
  result.splice(overIdx, 0, { ...activeColor, groupId: overColor.groupId });
  return result;
}

/**
 * Moves a color to the end of `targetGroupId` (or to the end of ungrouped
 * colors when `targetGroupId` is undefined).
 * Used when dropping a color onto an empty group drop zone.
 */
export function appendPaletteItemToGroup(
  palette: Color[],
  activeId: string,
  targetGroupId: string | undefined,
): Color[] {
  const activeColor = palette.find(c => c.id === activeId);
  if (!activeColor) return palette;
  if (activeColor.groupId === targetGroupId) return palette;

  const withoutActive = palette.filter(c => c.id !== activeId);
  const lastIdx = withoutActive.reduce(
    (last, c, i) => (c.groupId === targetGroupId ? i : last),
    -1,
  );
  const result = [...withoutActive];
  result.splice(lastIdx + 1, 0, { ...activeColor, groupId: targetGroupId });
  return result;
}

/**
 * Reorders colors within the same group, leaving all other palette entries
 * in place.
 */
export function reorderWithinGroup(
  palette: Color[],
  activeId: string,
  overId: string,
): Color[] {
  const activeColor = palette.find(c => c.id === activeId);
  const overColor = palette.find(c => c.id === overId);
  if (!activeColor || !overColor) return palette;
  if (activeColor.groupId !== overColor.groupId) return palette;

  const gid = activeColor.groupId;
  const groupColors = palette.filter(c => c.groupId === gid);
  const oldIdx = groupColors.findIndex(c => c.id === activeId);
  const newIdx = groupColors.findIndex(c => c.id === overId);
  if (oldIdx === newIdx) return palette;

  const reordered = arrayMove(groupColors, oldIdx, newIdx);
  let gi = 0;
  return palette.map(c => (c.groupId === gid ? reordered[gi++] : c));
}
