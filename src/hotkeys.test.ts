import { describe, it, expect } from 'vitest';
import { hotkeyParts, hotkeyLabel, HOTKEYS } from './hotkeys';

describe('hotkeyParts', () => {
  it('maps mod to ⌘', () => {
    expect(hotkeyParts('mod+S')).toEqual(['⌘', 'S']);
  });

  it('maps shift to ⇧', () => {
    expect(hotkeyParts('mod+shift+Z')).toEqual(['⌘', '⇧', 'Z']);
  });

  it('maps Escape to Esc', () => {
    expect(hotkeyParts('Escape')).toEqual(['Esc']);
  });

  it('uppercases plain letter keys', () => {
    expect(hotkeyParts('c')).toEqual(['C']);
  });

  it('handles a single modifier-free key', () => {
    expect(hotkeyParts('?')).toEqual(['?']);
  });
});

describe('hotkeyLabel', () => {
  it('joins parts with no separator', () => {
    expect(hotkeyLabel('mod+S')).toBe('⌘S');
  });

  it('produces compact label for redo', () => {
    expect(hotkeyLabel(HOTKEYS.REDO)).toBe('⌘⇧Z');
  });

  it('produces compact label for a single key', () => {
    expect(hotkeyLabel(HOTKEYS.ADD_COLOR)).toBe('C');
  });
});
