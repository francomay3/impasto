import { describe, expect, it } from 'vitest';
import { ColorPinPointerDragSession } from './ColorPinPointerDragSession';
import type { ColorPin } from './ColorPinState';

function pin(id: string, x: number, y: number): ColorPin {
  return Object.freeze({
    id,
    imageX: x,
    imageY: y,
    radiusPx: 1,
    color: '#000000',
  });
}

describe('ColorPinPointerDragSession', () => {
  it('tryCommitEnd is null when all tracked moves stay within epsilon', () => {
    const s = new ColorPinPointerDragSession();
    const start = [pin('a', 5, 5)];
    s.begin(['a'], start);
    const end = [pin('a', 5.5, 5.5)];
    expect(s.tryCommitEnd(end)).toBeNull();
  });

  it('tryCommitEnd returns before/after when a tracked pin exceeds epsilon', () => {
    const s = new ColorPinPointerDragSession();
    const start = [pin('a', 5, 5)];
    s.begin(['a'], start);
    const end = [pin('a', 9, 5)];
    const c = s.tryCommitEnd(end);
    expect(c).not.toBeNull();
    expect(c!.beforePins[0]!.imageX).toBe(5);
    expect(c!.afterPins[0]!.imageX).toBe(9);
  });

  it('begin with no resolvable ids leaves session inactive', () => {
    const s = new ColorPinPointerDragSession();
    s.begin(['missing'], [pin('a', 0, 0)]);
    expect(s.isActive()).toBe(false);
  });
});
