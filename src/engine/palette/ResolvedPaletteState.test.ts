import { describe, expect, it, vi } from 'vitest';
import { ResolvedPaletteState } from './ResolvedPaletteState';

const lab = (l: number, a: number, b: number) => ({ l, a, b });

describe('ResolvedPaletteState', () => {
  it('getByPinId reads the latest setEntries map', () => {
    const s = new ResolvedPaletteState();
    const e = { pinId: 'p1', lab: lab(1, 2, 3), displayHex: '#010101' };
    s.setEntries([e]);
    expect(s.getByPinId('p1')?.displayHex).toBe('#010101');
    expect(s.getByPinId('missing')).toBeUndefined();
  });

  it('getAll keeps the same reference when setEntries is a no-op', () => {
    const s = new ResolvedPaletteState();
    const row = { pinId: 'p1', lab: lab(5, 0, 0), displayHex: '#ff0000' };
    s.setEntries([row]);
    const a = s.getAll();
    s.setEntries([{ ...row }]);
    expect(s.getAll()).toBe(a);
  });

  it('subscribe fires only when the snapshot actually changes', () => {
    const s = new ResolvedPaletteState();
    const spy = vi.fn();
    s.subscribe(spy);
    const row = { pinId: 'p1', lab: lab(1, 0, 0), displayHex: '#000000' };
    s.setEntries([row]);
    expect(spy).toHaveBeenCalledTimes(1);
    s.setEntries([{ ...row }]);
    expect(spy).toHaveBeenCalledTimes(1);
    s.setEntries([{ ...row, displayHex: '#ffffff' }]);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('clear notifies when non-empty', () => {
    const s = new ResolvedPaletteState();
    const spy = vi.fn();
    s.subscribe(spy);
    s.setEntries([{ pinId: 'a', lab: lab(0, 0, 0), displayHex: '#000000' }]);
    spy.mockClear();
    s.clear();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(s.getAll()).toHaveLength(0);
  });
});
