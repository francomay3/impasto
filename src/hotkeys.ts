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
} as const;

export type ShortcutContext = 'Global' | 'Palette' | 'Filters';

interface ShortcutMeta {
  action: string;
  context: ShortcutContext;
  /** Key this is an alternate binding for — it will be merged into that entry rather than shown separately. */
  aliasOf?: keyof typeof HOTKEYS;
}

/**
 * Metadata for every hotkey. Typed as Record<keyof typeof HOTKEYS, ...> so that
 * adding a new entry to HOTKEYS without registering it here is a compile error.
 */
export const HOTKEY_META: Record<keyof typeof HOTKEYS, ShortcutMeta> = {
  SAVE:          { action: 'Save',                   context: 'Global' },
  UNDO:          { action: 'Undo',                   context: 'Global' },
  REDO:          { action: 'Redo',                   context: 'Global' },
  REDO_ALT:      { action: 'Redo',                   context: 'Global', aliasOf: 'REDO' },
  CANCEL:        { action: 'Cancel / Close',          context: 'Global' },
  SHOW_SHORTCUTS:{ action: 'Keyboard Shortcuts',      context: 'Global' },
  ADD_FILTER:    { action: 'Add Filter',              context: 'Filters' },
  ADD_COLOR:     { action: 'Sample New Color',        context: 'Palette' },
  DELETE_COLOR:  { action: 'Delete Selected Color',   context: 'Palette' },
  TOOL_SELECT:   { action: 'Select Tool',             context: 'Palette' },
  TOOL_MARQUEE:  { action: 'Marquee Select',          context: 'Palette' },
};
