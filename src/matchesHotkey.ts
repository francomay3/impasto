import { HOTKEY_META, type HotkeyRegistryKey } from './hotkeys';

type ModifierAxis = 'mod' | 'shift' | 'alt';

function modifierPresent(e: KeyboardEvent, axis: ModifierAxis): boolean {
  if (axis === 'mod') return e.metaKey || e.ctrlKey;
  if (axis === 'shift') return e.shiftKey;
  return e.altKey;
}

/**
 * True when `e` matches the physical key + modifier intent recorded for `key` in {@link HOTKEY_META}.
 * Ignores target/focus — callers that care should gate separately.
 */
export function matchesHotkey(e: KeyboardEvent, key: HotkeyRegistryKey): boolean {
  const meta = HOTKEY_META[key];
  const codes = meta.codes;
  if (!codes?.length) return false;
  if (!codes.includes(e.code)) return false;

  const spec = meta.modifiers ?? {};
  const axes: ModifierAxis[] = ['mod', 'shift', 'alt'];
  for (const axis of axes) {
    const requirement = spec[axis] ?? 'forbidden';
    const present = modifierPresent(e, axis);
    if (requirement === 'required' && !present) return false;
    if (requirement !== 'required' && present) return false;
  }
  return true;
}
