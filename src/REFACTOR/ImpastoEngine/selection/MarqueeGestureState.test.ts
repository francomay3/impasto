import { describe, expect, it, vi } from 'vitest';
import { MarqueeGestureState } from './MarqueeGestureState';

describe('MarqueeGestureState', () => {
  it('start / move / clear and notifies subscribers', () => {
    const m = new MarqueeGestureState();
    const fn = vi.fn();
    m.subscribe(fn);
    expect(m.getDraft()).toBeNull();

    m.start('source', { x: 1, y: 2 });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(m.getDraft()).toEqual({
      surface: 'source',
      start: { x: 1, y: 2 },
      current: { x: 1, y: 2 },
    });

    m.move({ x: 5, y: 6 });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(m.getDraft()?.current).toEqual({ x: 5, y: 6 });

    m.clear();
    expect(fn).toHaveBeenCalledTimes(3);
    expect(m.getDraft()).toBeNull();

    m.clear();
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('move is a no-op when there is no draft', () => {
    const m = new MarqueeGestureState();
    const fn = vi.fn();
    m.subscribe(fn);
    m.move({ x: 9, y: 9 });
    expect(fn).not.toHaveBeenCalled();
  });
});
