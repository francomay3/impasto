import { describe, it, expect } from 'vitest';
import { getPixelHex } from './colorUtils';

function makeCanvas(
  pixel: Uint8ClampedArray,
  rect = { left: 0, top: 0, width: 100, height: 100 },
  noContext = false,
): HTMLCanvasElement {
  return {
    getBoundingClientRect: () => rect,
    getContext: () => (noContext ? null : { getImageData: () => ({ data: pixel }) }),
    width: rect.width,
    height: rect.height,
  } as unknown as HTMLCanvasElement;
}

describe('getPixelHex', () => {
  it('returns the hex color for a pixel within bounds', () => {
    const canvas = makeCanvas(new Uint8ClampedArray([255, 0, 0, 255]));
    expect(getPixelHex(canvas, 50, 50)).toBe('#ff0000');
  });

  it('returns null when click is left of canvas', () => {
    const canvas = makeCanvas(new Uint8ClampedArray([0, 0, 0, 255]), { left: 10, top: 0, width: 100, height: 100 });
    expect(getPixelHex(canvas, 5, 50)).toBeNull();
  });

  it('returns null when click is above canvas', () => {
    const canvas = makeCanvas(new Uint8ClampedArray([0, 0, 0, 255]), { left: 0, top: 10, width: 100, height: 100 });
    expect(getPixelHex(canvas, 50, 5)).toBeNull();
  });

  it('returns null when click is to the right of canvas', () => {
    const canvas = makeCanvas(new Uint8ClampedArray([0, 0, 0, 255]));
    expect(getPixelHex(canvas, 200, 50)).toBeNull();
  });

  it('returns null when click is below canvas', () => {
    const canvas = makeCanvas(new Uint8ClampedArray([0, 0, 0, 255]));
    expect(getPixelHex(canvas, 50, 200)).toBeNull();
  });

  it('returns null when canvas has no 2d context', () => {
    const canvas = makeCanvas(new Uint8ClampedArray([0, 0, 0, 255]), undefined, true);
    expect(getPixelHex(canvas, 50, 50)).toBeNull();
  });

  it('handles a blue pixel correctly', () => {
    const canvas = makeCanvas(new Uint8ClampedArray([0, 0, 255, 255]));
    expect(getPixelHex(canvas, 50, 50)).toBe('#0000ff');
  });
});
