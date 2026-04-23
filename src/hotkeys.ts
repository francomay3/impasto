/**
 * Central hotkey configuration.
 * All global keyboard shortcuts are defined here.
 * Used with Mantine's `useHotkeys` hook.
 */

/** Convert a HOTKEYS value to an array of displayable key parts, e.g. 'mod+shift+Z' → ['⌘', '⇧', 'Z'] */
export function hotkeyParts(hotkey: string): string[] {
  return hotkey.split('+').map((k) => {
    if (k === 'mod') return '⌘';
    if (k === 'shift') return '⇧';
    if (k === 'Escape') return 'Esc';
    return k.toUpperCase();
  });
}

/** Convert a HOTKEYS value to a compact display label, e.g. 'mod+F' → '⌘F' */
export function hotkeyLabel(hotkey: string): string {
  return hotkeyParts(hotkey).join('');
}

export const HOTKEYS = {
  SAVE: 'mod+S',
  UNDO: 'mod+Z',
  REDO: 'mod+shift+Z',
  REDO_ALT: 'mod+Y',
  CANCEL: 'Escape',
  ADD_FILTER: 'mod+F',
  ADD_COLOR: 'C',
  DELETE_COLOR: 'X',
  SHOW_SHORTCUTS: '?',
  TOOL_SELECT: 'V',
  TOOL_MARQUEE: 'S',
  /** Display chord for pan (H); Esc is an alternate code on the same registry row (see HOTKEY_META.PAN_TOOL). */
  PAN_TOOL: 'H',
  BRUSH_NUDGE_UP: 'mod+↑',
  BRUSH_NUDGE_DOWN: 'mod+↓',
} as const;

export type HotkeyRegistryKey = keyof typeof HOTKEYS;

export type ShortcutContext = 'Global' | 'Palette' | 'Filters';

/** How a modifier must relate to the event for {@link matchesHotkey}. */
type HotkeyModifierRequirement = 'required' | 'forbidden';

interface HotkeyModifierSpec {
  /** Cmd on macOS or Ctrl elsewhere — {@link KeyboardEvent.metaKey} || {@link KeyboardEvent.ctrlKey}. */
  mod?: HotkeyModifierRequirement;
  shift?: HotkeyModifierRequirement;
  alt?: HotkeyModifierRequirement;
}

interface ShortcutMeta {
  action: string;
  context: ShortcutContext;
  /** Key this is an alternate binding for — it will be merged into that entry rather than shown separately. */
  aliasOf?: keyof typeof HOTKEYS;
  /** {@link KeyboardEvent.code} values that can fire this shortcut (physical key positions). */
  codes?: readonly string[];
  /**
   * Modifier matching: missing axes default to `'forbidden'` (strict).
   * `mod` means meta **or** ctrl, matching browser “primary shortcut” conventions.
   */
  modifiers?: HotkeyModifierSpec;
}

/**
 * Metadata for every hotkey. Typed as Record<keyof typeof HOTKEYS, ...> so that
 * adding a new entry to HOTKEYS without registering it here is a compile error.
 */
export const HOTKEY_META: Record<keyof typeof HOTKEYS, ShortcutMeta> = {
  SAVE: { action: 'Save', context: 'Global', codes: ['KeyS'], modifiers: { mod: 'required' } },
  UNDO: { action: 'Undo', context: 'Global', codes: ['KeyZ'], modifiers: { mod: 'required' } },
  REDO: { action: 'Redo', context: 'Global', codes: ['KeyZ'], modifiers: { mod: 'required', shift: 'required' } },
  REDO_ALT: {
    action: 'Redo',
    context: 'Global',
    aliasOf: 'REDO',
    codes: ['KeyY'],
    modifiers: { mod: 'required' },
  },
  CANCEL: { action: 'Cancel / Close', context: 'Global', codes: ['Escape'], modifiers: {} },
  SHOW_SHORTCUTS: {
    action: 'Keyboard Shortcuts',
    context: 'Global',
    codes: ['Slash'],
    modifiers: { shift: 'required' },
  },
  ADD_FILTER: { action: 'Add Filter', context: 'Filters', codes: ['KeyF'], modifiers: { mod: 'required' } },
  ADD_COLOR: { action: 'Sample New Color', context: 'Palette', codes: ['KeyC'], modifiers: {} },
  // Engine delete also accepts Backspace/Delete; registry lists all physical codes for one matcher.
  DELETE_COLOR: {
    action: 'Delete Selected Color',
    context: 'Palette',
    codes: ['KeyX', 'Backspace', 'Delete'],
    modifiers: {},
  },
  TOOL_SELECT: { action: 'Select Tool', context: 'Palette', codes: ['KeyV'], modifiers: {} },
  TOOL_MARQUEE: { action: 'Marquee Select', context: 'Palette', codes: ['KeyS'], modifiers: {} },
  PAN_TOOL: {
    action: 'Pan Tool',
    context: 'Global',
    codes: ['KeyH', 'Escape'],
    modifiers: {},
  },
  BRUSH_NUDGE_UP: {
    action: 'Increase Sample Brush Size',
    context: 'Global',
    codes: ['ArrowUp'],
    modifiers: { mod: 'required' },
  },
  BRUSH_NUDGE_DOWN: {
    action: 'Decrease Sample Brush Size',
    context: 'Global',
    codes: ['ArrowDown'],
    modifiers: { mod: 'required' },
  },
};
