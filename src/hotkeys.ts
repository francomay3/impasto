/**
 * Central hotkey configuration.
 * All global keyboard shortcuts are defined here.
 * Used with Mantine's `useHotkeys` hook.
 */

export const HOTKEYS = {
  SAVE:       'mod+S',
  UNDO:       'mod+Z',
  REDO:       'mod+shift+Z',
  REDO_ALT:   'mod+Y',
  CANCEL:     'Escape',
  ADD_FILTER: 'mod+F',
  ADD_COLOR:  'C',
} as const;
