import { describe, it, expect } from 'vitest';
import { matchesHotkey } from './matchesHotkey';

/** Node test env has no DOM `KeyboardEvent`; stub only the fields {@link matchesHotkey} reads. */
function keydown(init: Partial<KeyboardEvent> & { code: string }): KeyboardEvent {
  return {
    code: init.code,
    metaKey: init.metaKey ?? false,
    ctrlKey: init.ctrlKey ?? false,
    shiftKey: init.shiftKey ?? false,
    altKey: init.altKey ?? false,
  } as KeyboardEvent;
}

describe('matchesHotkey', () => {
  it('UNDO: mod+Z matches; plain Z does not', () => {
    expect(matchesHotkey(keydown({ code: 'KeyZ', metaKey: true }), 'UNDO')).toBe(true);
    expect(matchesHotkey(keydown({ code: 'KeyZ' }), 'UNDO')).toBe(false);
  });

  it('modifier strictness: UNDO rejects mod+shift+Z; REDO accepts it', () => {
    const modShiftZ = keydown({ code: 'KeyZ', metaKey: true, shiftKey: true });
    expect(matchesHotkey(modShiftZ, 'UNDO')).toBe(false);
    expect(matchesHotkey(modShiftZ, 'REDO')).toBe(true);
  });

  it('PAN_TOOL matches KeyH and Escape with no modifiers', () => {
    expect(matchesHotkey(keydown({ code: 'KeyH' }), 'PAN_TOOL')).toBe(true);
    expect(matchesHotkey(keydown({ code: 'Escape' }), 'PAN_TOOL')).toBe(true);
    expect(matchesHotkey(keydown({ code: 'KeyH', metaKey: true }), 'PAN_TOOL')).toBe(false);
  });

  it('DELETE_COLOR matches KeyX, Backspace, and Delete without modifiers', () => {
    expect(matchesHotkey(keydown({ code: 'KeyX' }), 'DELETE_COLOR')).toBe(true);
    expect(matchesHotkey(keydown({ code: 'Backspace' }), 'DELETE_COLOR')).toBe(true);
    expect(matchesHotkey(keydown({ code: 'Delete' }), 'DELETE_COLOR')).toBe(true);
    expect(matchesHotkey(keydown({ code: 'KeyX', shiftKey: true }), 'DELETE_COLOR')).toBe(false);
  });

  it('treats metaKey and ctrlKey as equivalent for mod', () => {
    expect(matchesHotkey(keydown({ code: 'KeyZ', metaKey: true }), 'UNDO')).toBe(true);
    expect(matchesHotkey(keydown({ code: 'KeyZ', ctrlKey: true }), 'UNDO')).toBe(true);
  });

  it('REDO vs REDO_ALT: each matches its own chord only', () => {
    const redo = keydown({ code: 'KeyZ', metaKey: true, shiftKey: true });
    expect(matchesHotkey(redo, 'REDO')).toBe(true);
    expect(matchesHotkey(redo, 'REDO_ALT')).toBe(false);

    const redoAlt = keydown({ code: 'KeyY', metaKey: true });
    expect(matchesHotkey(redoAlt, 'REDO_ALT')).toBe(true);
    expect(matchesHotkey(redoAlt, 'REDO')).toBe(false);
  });

  it('SHOW_SHORTCUTS: shift+/ (Slash) only', () => {
    expect(matchesHotkey(keydown({ code: 'Slash', shiftKey: true }), 'SHOW_SHORTCUTS')).toBe(true);
    expect(matchesHotkey(keydown({ code: 'Slash' }), 'SHOW_SHORTCUTS')).toBe(false);
  });

  it('BRUSH_NUDGE_UP / BRUSH_NUDGE_DOWN split arrow codes with mod', () => {
    expect(matchesHotkey(keydown({ code: 'ArrowUp', ctrlKey: true }), 'BRUSH_NUDGE_UP')).toBe(true);
    expect(matchesHotkey(keydown({ code: 'ArrowUp', ctrlKey: true }), 'BRUSH_NUDGE_DOWN')).toBe(false);
    expect(matchesHotkey(keydown({ code: 'ArrowDown', metaKey: true }), 'BRUSH_NUDGE_DOWN')).toBe(true);
    expect(matchesHotkey(keydown({ code: 'ArrowDown' }), 'BRUSH_NUDGE_DOWN')).toBe(false);
  });

  it('rejects alt when not specified (strict default)', () => {
    expect(matchesHotkey(keydown({ code: 'KeyZ', metaKey: true, altKey: true }), 'UNDO')).toBe(false);
  });
});
