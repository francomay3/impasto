import { describe, it, expect } from 'vitest';
import { findBestMatchPosition } from './labSearch';
import { rgbToLab } from './colorUtils';

function makeImageData(pixels: number[], width: number, height: number): ImageData {
  return { data: new Uint8ClampedArray(pixels), width, height } as unknown as ImageData;
}

describe('findBestMatchPosition', () => {
  it('finds the single pixel in a 1x1 image', () => {
    const img = makeImageData([255, 0, 0, 255], 1, 1);
    const target = rgbToLab(255, 0, 0);
    const result = findBestMatchPosition(img, target, 1);
    expect(result).toEqual({ x: 0, y: 0, deltaE: 0 });
  });

  it('returns deltaE of 0 for an exact match', () => {
    const img = makeImageData([0, 255, 0, 255], 1, 1);
    const target = rgbToLab(0, 255, 0);
    const { deltaE } = findBestMatchPosition(img, target, 1);
    expect(deltaE).toBeCloseTo(0, 5);
  });

  it('identifies the closest pixel in a 2x1 image', () => {
    // Pixel 0: red, Pixel 1: blue — search for red
    const img = makeImageData([255, 0, 0, 255, 0, 0, 255, 255], 2, 1);
    const target = rgbToLab(255, 0, 0);
    const { x, y } = findBestMatchPosition(img, target, 1);
    expect(x).toBe(0);
    expect(y).toBe(0);
  });

  it('identifies the closest pixel when target is the second color', () => {
    const img = makeImageData([255, 0, 0, 255, 0, 0, 255, 255], 2, 1);
    const target = rgbToLab(0, 0, 255);
    const { x } = findBestMatchPosition(img, target, 1);
    expect(x).toBe(1);
  });

  it('refinement pass finds a pixel missed by coarse stride', () => {
    // 3x1 image: red | blue | red. step=2 coarse pass samples x=0 and x=2 (both red).
    // The refinement pass around x=0 then checks x=1 (blue) and should update the best.
    const img = makeImageData(
      [255, 0, 0, 255,  0, 0, 255, 255,  255, 0, 0, 255],
      3, 1,
    );
    const target = rgbToLab(0, 0, 255);
    const { x } = findBestMatchPosition(img, target, 2);
    expect(x).toBe(1);
  });
});
