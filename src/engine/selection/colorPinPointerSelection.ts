import type { SelectionEntry } from './SelectionState';
import { applyMarqueeSelection } from './marqueeSelectionApply';
import { colorPinEntry } from './selectionEntries';

/** How a primary click on a color pin should change {@link SelectionEntry} list. */
type ColorPinPickIntent = 'replace' | 'add' | 'toggle';

/**
 * Maps modifier keys to pick intent. **Figma-style:** Shift (or Cmd/Ctrl) on a pin toggles its membership in the selection;
 * plain click replaces with only that pin.
 */
export function colorPinPickIntentFromModifierKeys(keys: {
  readonly shiftKey: boolean;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
}): ColorPinPickIntent {
  if (keys.shiftKey || keys.metaKey || keys.ctrlKey) {
    return 'toggle';
  }
  return 'replace';
}

/**
 * Applies a color-pin pointer pick to the previous selection.
 * - **replace**: selection becomes only the clicked pin.
 * - **add**: union with existing color-pin selection (same as marquee **add**); kept for callers/tests.
 * - **toggle**: removes the pin if present; otherwise adds like **add** (Figma Shift-click).
 */
export function applyColorPinPointerSelection(
  prev: readonly SelectionEntry[],
  clickedPinId: string,
  intent: ColorPinPickIntent,
): SelectionEntry[] {
  switch (intent) {
    case 'replace':
      return [colorPinEntry(clickedPinId)];
    case 'add':
      return applyMarqueeSelection(prev, [clickedPinId], 'add');
    case 'toggle': {
      const selected = prev.some((e) => e.kind === 'colorPin' && e.id === clickedPinId);
      if (selected) {
        return prev.filter((e) => e.kind !== 'colorPin' || e.id !== clickedPinId);
      }
      return applyMarqueeSelection(prev, [clickedPinId], 'add');
    }
  }
}
