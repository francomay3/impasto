import { describe, expect, it, vi } from 'vitest';
import { ColorPinState } from './ColorPinState';

describe('ColorPinState', () => {
  it('removeById notifies only when a pin was removed', () => {
    const s = new ColorPinState();
    const spy = vi.fn();
    s.subscribe(spy);
    s.removeById('missing');
    expect(spy).not.toHaveBeenCalled();
    s.addFromSample({ imageX: 1, imageY: 2, radiusPx: 3 }, '#000000');
    expect(spy).toHaveBeenCalledTimes(1);
    const id = s.getAll()[0]!.id;
    s.removeById(id);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(s.getAll()).toHaveLength(0);
  });

  it('addFromSampleInsertAt splices a row at the given index', () => {
    const s = new ColorPinState();
    const a = s.addFromSample({ imageX: 0, imageY: 0, radiusPx: 1 }, '#000000');
    const b = s.addFromSample({ imageX: 1, imageY: 1, radiusPx: 1 }, '#111111');
    const mid = s.addFromSampleInsertAt({ imageX: 5, imageY: 5, radiusPx: 1 }, '#ffffff', 1);
    expect(s.getAll().map((p) => p.id)).toEqual([a, mid, b]);
  });

  it('removeByIds removes all matches in one notify', () => {
    const s = new ColorPinState();
    const spy = vi.fn();
    s.subscribe(spy);
    const a = s.addFromSample({ imageX: 0, imageY: 0, radiusPx: 1 }, '#000000');
    const b = s.addFromSample({ imageX: 1, imageY: 1, radiusPx: 1 }, '#111111');
    const c = s.addFromSample({ imageX: 2, imageY: 2, radiusPx: 1 }, '#222222');
    spy.mockClear();
    s.removeByIds([a, c, 'missing']);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(s.getAll().map((p) => p.id)).toEqual([b]);
  });

  it('repositionMany updates centers and display color from the engine', () => {
    const s = new ColorPinState();
    const id = s.addFromSample({ imageX: 1, imageY: 2, radiusPx: 3 }, '#abcdef');
    s.repositionMany([{ id, imageX: 9, imageY: 8, color: '#112233' }]);
    const p = s.getAll()[0]!;
    expect(p.imageX).toBe(9);
    expect(p.imageY).toBe(8);
    expect(p.color).toBe('#112233');
    expect(p.radiusPx).toBe(3);
  });

  it('repositionMany is a no-op when nothing changes', () => {
    const s = new ColorPinState();
    const spy = vi.fn();
    s.subscribe(spy);
    const id = s.addFromSample({ imageX: 1, imageY: 2, radiusPx: 1 }, '#000000');
    spy.mockClear();
    s.repositionMany([{ id, imageX: 1, imageY: 2, color: '#000000' }]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('queryColorPinIdsInImageRect uses pin center in rect', () => {
    const s = new ColorPinState();
    const a = s.addFromSample({ imageX: 5, imageY: 5, radiusPx: 2 }, '#111111');
    const b = s.addFromSample({ imageX: 20, imageY: 5, radiusPx: 2 }, '#222222');
    const ids = s.queryColorPinIdsInImageRect({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    expect(ids).toEqual([a]);
    expect(ids).not.toContain(b);
  });

  it('setAllPins replaces the list and notifies when changed', () => {
    const s = new ColorPinState();
    const spy = vi.fn();
    s.subscribe(spy);
    const id = s.addFromSample({ imageX: 1, imageY: 2, radiusPx: 3 }, '#abcdef');
    spy.mockClear();
    s.setAllPins([
      Object.freeze({
        id,
        imageX: 9,
        imageY: 8,
        radiusPx: 3,
        color: '#112233',
      }),
    ]);
    expect(spy).toHaveBeenCalledTimes(1);
    const p = s.getAll()[0]!;
    expect(p.imageX).toBe(9);
    expect(p.color).toBe('#112233');
  });
});
