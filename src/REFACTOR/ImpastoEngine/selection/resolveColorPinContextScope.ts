import type { SelectionEntry } from './SelectionState';

/**
 * Color-pin ids from selection, in list order, first occurrence wins (defensive if duplicates ever appear).
 */
function colorPinIdsInSelectionOrder(selection: readonly SelectionEntry[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const e of selection) {
    if (e.kind === 'colorPin' && !seen.has(e.id)) {
      seen.add(e.id);
      out.push(e.id);
    }
  }
  return out;
}

/**
 * Pin ids that a context menu anchored on `clickedPinId` should operate on.
 * - If the clicked pin is part of the current selection → all selected color-pin ids (selection order).
 * - Otherwise → only the clicked pin (selection is not changed here).
 */
export function resolveColorPinContextScope(
  clickedPinId: string,
  selection: readonly SelectionEntry[],
): readonly string[] {
  const ordered = colorPinIdsInSelectionOrder(selection);
  if (ordered.includes(clickedPinId)) {
    return ordered;
  }
  return [clickedPinId];
}
