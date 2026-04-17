/**
 * Local structural type so this module does not need to import from selection/
 * (colorPins/ must not depend on selection/).
 */
type SelectionLike = { readonly kind: string; readonly id: string };

/**
 * All color-pin ids from a selection array, preserving list order, no deduplication.
 * Use {@link colorPinIdsInSelectionOrder} when dedup matters (e.g. context-menu scope).
 */
export function colorPinIdsFromSelection(entries: readonly SelectionLike[]): readonly string[] {
  return entries.filter((e) => e.kind === 'colorPin').map((e) => e.id);
}

/**
 * Color-pin ids from selection, in list order, first occurrence wins (defensive if duplicates ever appear).
 */
function colorPinIdsInSelectionOrder(selection: readonly SelectionLike[]): string[] {
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
  selection: readonly SelectionLike[],
): readonly string[] {
  const ordered = colorPinIdsInSelectionOrder(selection);
  if (ordered.includes(clickedPinId)) {
    return ordered;
  }
  return [clickedPinId];
}
