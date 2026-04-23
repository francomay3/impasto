import { describe, expect, it, vi } from 'vitest';
import { ResolvedPaletteState } from './ResolvedPaletteState';

const lab = (l: number, a: number, b: number) => ({ l, a, b });
const entry = (pinId: string, hex: string) => ({ pinId, lab: lab(1, 2, 3), displayHex: hex });

describe('ResolvedPaletteState', () => {
  it('setEntry inserts and updates a single pin', () => {
    const s = new ResolvedPaletteState();
    s.setEntry(entry('p1', '#010101'));
    expect(s.getByPinId('p1')?.displayHex).toBe('#010101');
    s.setEntry(entry('p1', '#020202'));
    expect(s.getByPinId('p1')?.displayHex).toBe('#020202');
  });

  it('setEntry skips notify when the stored entry is structurally equal', () => {
    const s = new ResolvedPaletteState();
    const spy = vi.fn();
    s.subscribe(spy);
    s.setEntry(entry('p1', '#ff0000'));
    expect(spy).toHaveBeenCalledTimes(1);
    s.setEntry(entry('p1', '#ff0000'));
    expect(spy).toHaveBeenCalledTimes(1);
    s.setEntry(entry('p1', '#00ff00'));
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('removeEntry drops one pin and notifies', () => {
    const s = new ResolvedPaletteState();
    s.setEntry(entry('a', '#aaaaaa'));
    s.setEntry(entry('b', '#bbbbbb'));
    const spy = vi.fn();
    s.subscribe(spy);
    s.removeEntry('a');
    expect(s.getByPinId('a')).toBeUndefined();
    expect(s.getByPinId('b')).toBeDefined();
    expect(spy).toHaveBeenCalledTimes(1);
    s.removeEntry('missing');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('retainPinIds removes entries whose id is not in the active set', () => {
    const s = new ResolvedPaletteState();
    s.setEntry(entry('a', '#aaaaaa'));
    s.setEntry(entry('b', '#bbbbbb'));
    s.setEntry(entry('c', '#cccccc'));
    const spy = vi.fn();
    s.subscribe(spy);
    s.retainPinIds(['b']);
    expect(s.getByPinId('a')).toBeUndefined();
    expect(s.getByPinId('b')).toBeDefined();
    expect(s.getByPinId('c')).toBeUndefined();
    expect(spy).toHaveBeenCalledTimes(1);
    s.retainPinIds(['b']);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('getAll returns the same reference between notifies', () => {
    const s = new ResolvedPaletteState();
    s.setEntry(entry('p1', '#ff0000'));
    const a = s.getAll();
    expect(s.getAll()).toBe(a);
    s.setEntry(entry('p1', '#00ff00'));
    expect(s.getAll()).not.toBe(a);
  });

  it('clear empties and notifies when non-empty', () => {
    const s = new ResolvedPaletteState();
    const spy = vi.fn();
    s.subscribe(spy);
    s.setEntry(entry('a', '#000000'));
    spy.mockClear();
    s.clear();
    expect(s.getAll()).toHaveLength(0);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
