import { describe, expect, it } from 'vitest';
import {
  clampImagePointInsideRaster,
  isBelowDragEpsilon,
  isPointInsideImageExtents,
  normalizeImageRect,
} from './imageRect';

describe('imageRect', () => {
  it('normalizeImageRect handles inverted corners', () => {
    expect(normalizeImageRect({ x: 10, y: 10 }, { x: 0, y: 0 })).toEqual({
      minX: 0,
      maxX: 10,
      minY: 0,
      maxY: 10,
    });
  });

  it('isBelowDragEpsilon inclusive at boundary', () => {
    const a = { x: 0, y: 0 };
    expect(isBelowDragEpsilon(a, { x: 3, y: 3 }, 3)).toBe(true);
    expect(isBelowDragEpsilon(a, { x: 3.1, y: 0 }, 3)).toBe(false);
    expect(isBelowDragEpsilon(a, { x: 0, y: 3.1 }, 3)).toBe(false);
  });

  it('isPointInsideImageExtents uses half-open raster bounds', () => {
    expect(isPointInsideImageExtents(0, 0, 10, 8)).toBe(true);
    expect(isPointInsideImageExtents(9.5, 7.2, 10, 8)).toBe(true);
    expect(isPointInsideImageExtents(-0.1, 0, 10, 8)).toBe(false);
    expect(isPointInsideImageExtents(10, 0, 10, 8)).toBe(false);
    expect(isPointInsideImageExtents(0, 8, 10, 8)).toBe(false);
    expect(isPointInsideImageExtents(0, 0, 0, 8)).toBe(false);
  });

  it('clampImagePointInsideRaster matches half-open extent', () => {
    const lo = clampImagePointInsideRaster(-5, 100, 10, 8);
    expect(lo.x).toBe(0);
    expect(lo.y).toBeLessThan(8);
    expect(lo.y).toBeGreaterThan(7.999);
    const hi = clampImagePointInsideRaster(99, 99, 10, 8);
    expect(hi.x).toBeLessThan(10);
    expect(hi.y).toBeLessThan(8);
    expect(hi.x).toBeGreaterThan(9.9);
    expect(hi.y).toBeGreaterThan(7.9);
  });
});
