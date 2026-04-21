import { describe, expect, it, vi } from 'vitest';
import { SelectionState } from './SelectionState';

describe('SelectionState', () => {
  it('set replaces selection and notifies', () => {
    const s = new SelectionState();
    const spy = vi.fn();
    s.subscribe(spy);
    s.set([{ kind: 'colorPin', id: 'a' }]);
    expect(s.getAll()).toEqual([{ kind: 'colorPin', id: 'a' }]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('set no-ops when contents are unchanged', () => {
    const s = new SelectionState();
    const spy = vi.fn();
    s.subscribe(spy);
    s.set([{ kind: 'colorPin', id: 'a' }]);
    s.set([{ kind: 'colorPin', id: 'a' }]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('pruneColorPinsToValidIds removes stale pin ids', () => {
    const s = new SelectionState();
    s.set([{ kind: 'colorPin', id: 'gone' }, { kind: 'colorPin', id: 'keep' }]);
    s.pruneColorPinsToValidIds(new Set(['keep']));
    expect(s.getAll()).toEqual([{ kind: 'colorPin', id: 'keep' }]);
  });

  it('clear empties selection', () => {
    const s = new SelectionState();
    s.set([{ kind: 'colorPin', id: 'a' }]);
    s.clear();
    expect(s.getAll()).toEqual([]);
  });
});
