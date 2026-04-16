import { describe, expect, it, vi } from 'vitest';
import { HistoryManager } from './HistoryManager';

function record(
  undo: () => void,
  redo: () => void,
  weight: 'light' | 'heavy' = 'light',
): { undo: () => void; redo: () => void; weight: 'light' | 'heavy' } {
  return { undo, redo, weight };
}

describe('HistoryManager', () => {
  it('back calls undo and forward calls redo in order', () => {
    const log: string[] = [];
    const h = new HistoryManager({ maxLightEntries: 10, maxHeavyEntries: 10 });
    h.push(
      record(
        () => {
          log.push('u1');
        },
        () => {
          log.push('r1');
        },
      ),
    );
    h.push(
      record(
        () => {
          log.push('u2');
        },
        () => {
          log.push('r2');
        },
      ),
    );
    expect(h.canUndo()).toBe(true);
    expect(h.canRedo()).toBe(false);
    h.back();
    expect(log).toEqual(['u2']);
    expect(h.canRedo()).toBe(true);
    h.forward();
    expect(log).toEqual(['u2', 'r2']);
    h.back();
    h.back();
    expect(log).toEqual(['u2', 'r2', 'u2', 'u1']);
    h.forward();
    expect(log).toEqual(['u2', 'r2', 'u2', 'u1', 'r1']);
  });

  it('push clears the redo line', () => {
    const h = new HistoryManager({ maxLightEntries: 10, maxHeavyEntries: 10 });
    h.push(record(vi.fn(), vi.fn()));
    h.push(record(vi.fn(), vi.fn()));
    h.back();
    expect(h.canRedo()).toBe(true);
    h.push(record(vi.fn(), vi.fn()));
    expect(h.canRedo()).toBe(false);
  });

  it('drops oldest past entries when light cap is exceeded', () => {
    const h = new HistoryManager({ maxLightEntries: 3, maxHeavyEntries: 10 });
    const u0 = vi.fn();
    const u1 = vi.fn();
    const u2 = vi.fn();
    const u3 = vi.fn();
    h.push(record(u0, vi.fn()));
    h.push(record(u1, vi.fn()));
    h.push(record(u2, vi.fn()));
    h.push(record(u3, vi.fn()));
    h.back();
    h.back();
    h.back();
    expect(u0).not.toHaveBeenCalled();
    expect(u3).toHaveBeenCalledTimes(1);
    expect(u2).toHaveBeenCalledTimes(1);
    expect(u1).toHaveBeenCalledTimes(1);
    expect(h.canUndo()).toBe(false);
  });

  it('drops oldest past entries when heavy cap is exceeded', () => {
    const h = new HistoryManager({ maxLightEntries: 100, maxHeavyEntries: 2 });
    const u0 = vi.fn();
    const u1 = vi.fn();
    const u2 = vi.fn();
    h.push(record(u0, vi.fn(), 'heavy'));
    h.push(record(u1, vi.fn(), 'heavy'));
    h.push(record(u2, vi.fn(), 'heavy'));
    h.back();
    h.back();
    expect(u0).not.toHaveBeenCalled();
    expect(u2).toHaveBeenCalledTimes(1);
    expect(u1).toHaveBeenCalledTimes(1);
    expect(h.canUndo()).toBe(false);
  });

  it('notify subscribers on push, back, forward, and clear', () => {
    const h = new HistoryManager({ maxLightEntries: 10, maxHeavyEntries: 10 });
    const spy = vi.fn();
    h.subscribe(spy);
    h.push(record(vi.fn(), vi.fn()));
    expect(spy).toHaveBeenCalledTimes(1);
    h.back();
    expect(spy).toHaveBeenCalledTimes(2);
    h.forward();
    expect(spy).toHaveBeenCalledTimes(3);
    h.clear();
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('no-op back and forward when empty', () => {
    const h = new HistoryManager({ maxLightEntries: 10, maxHeavyEntries: 10 });
    const u = vi.fn();
    const r = vi.fn();
    h.back();
    h.forward();
    h.push(record(u, r));
    h.forward();
    expect(u).not.toHaveBeenCalled();
    expect(r).not.toHaveBeenCalled();
  });

  describe('clearSilently', () => {
    it('does not notify subscribers and clears undo/redo flags', () => {
      const h = new HistoryManager({ maxLightEntries: 10, maxHeavyEntries: 10 });
      const spy = vi.fn();
      h.subscribe(spy);
      h.push(record(vi.fn(), vi.fn()));
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockClear();
      expect(h.canUndo()).toBe(true);
      expect(h.canRedo()).toBe(false);

      h.clearSilently();

      expect(spy).not.toHaveBeenCalled();
      expect(h.canUndo()).toBe(false);
      expect(h.canRedo()).toBe(false);
    });

    it('clears both past and future without notifying', () => {
      const h = new HistoryManager({ maxLightEntries: 10, maxHeavyEntries: 10 });
      const spy = vi.fn();
      h.subscribe(spy);
      h.push(record(vi.fn(), vi.fn()));
      h.push(record(vi.fn(), vi.fn()));
      h.back();
      expect(h.canUndo()).toBe(true);
      expect(h.canRedo()).toBe(true);
      spy.mockClear();

      h.clearSilently();

      expect(spy).not.toHaveBeenCalled();
      expect(h.canUndo()).toBe(false);
      expect(h.canRedo()).toBe(false);
    });
  });
});
