import { describe, expect, it } from 'vitest';
import {
  applyColorPinPointerSelection,
  colorPinPickIntentFromModifierKeys,
} from './colorPinPointerSelection';

const pin = (id: string) => ({ kind: 'colorPin' as const, id });

describe('colorPinPickIntentFromModifierKeys', () => {
  it('plain click is replace', () => {
    expect(colorPinPickIntentFromModifierKeys({ shiftKey: false, metaKey: false, ctrlKey: false })).toBe(
      'replace',
    );
  });

  it('shift is toggle (Figma)', () => {
    expect(colorPinPickIntentFromModifierKeys({ shiftKey: true, metaKey: false, ctrlKey: false })).toBe(
      'toggle',
    );
  });

  it('meta or ctrl is toggle', () => {
    expect(colorPinPickIntentFromModifierKeys({ shiftKey: false, metaKey: true, ctrlKey: false })).toBe(
      'toggle',
    );
    expect(colorPinPickIntentFromModifierKeys({ shiftKey: true, metaKey: true, ctrlKey: false })).toBe(
      'toggle',
    );
    expect(colorPinPickIntentFromModifierKeys({ shiftKey: false, metaKey: false, ctrlKey: true })).toBe(
      'toggle',
    );
  });
});

describe('applyColorPinPointerSelection', () => {
  it('replace clears multi-select to one pin', () => {
    const prev = [pin('a'), pin('b')];
    expect(applyColorPinPointerSelection(prev, 'c', 'replace')).toEqual([pin('c')]);
  });

  it('add appends new id without reordering existing', () => {
    const prev = [pin('a')];
    expect(applyColorPinPointerSelection(prev, 'b', 'add')).toEqual([pin('a'), pin('b')]);
  });

  it('add is no-op order change when id already selected', () => {
    const prev = [pin('a'), pin('b')];
    expect(applyColorPinPointerSelection(prev, 'a', 'add')).toEqual([pin('a'), pin('b')]);
  });

  it('toggle removes when selected', () => {
    const prev = [pin('a'), pin('b')];
    expect(applyColorPinPointerSelection(prev, 'a', 'toggle')).toEqual([pin('b')]);
  });

  it('toggle adds when not selected', () => {
    const prev = [pin('a')];
    expect(applyColorPinPointerSelection(prev, 'b', 'toggle')).toEqual([pin('a'), pin('b')]);
  });
});
