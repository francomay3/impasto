import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { sampleCircleAverage, applyFilters } from './imageProcessing';
import type { FilterInstance } from '../types';

// ImageData is a browser API not available in the node test environment.
// Provide a minimal stub so the filter functions can construct return values.
beforeAll(() => {
  vi.stubGlobal('ImageData', class {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(data: Uint8ClampedArray, w: number, h: number) {
      this.data = data; this.width = w; this.height = h;
    }
  });
});
afterAll(() => vi.unstubAllGlobals());

/** Creates a minimal ImageData-like object from flat RGBA values. */
function makeImageData(pixels: number[], width: number, height: number) {
  return {
    data: new Uint8ClampedArray(pixels),
    width,
    height,
  } as unknown as ImageData;
}

describe('sampleCircleAverage', () => {
  it('returns the single pixel value for a 1x1 image with radius 0', () => {
    const img = makeImageData([200, 100, 50, 255], 1, 1);
    const [r, g, b, a] = sampleCircleAverage(img, 0, 0, 0);
    expect(r).toBeCloseTo(200);
    expect(g).toBeCloseTo(100);
    expect(b).toBeCloseTo(50);
    expect(a).toBeCloseTo(255);
  });

  it('returns [0,0,0,255] when no pixels are within the circle', () => {
    const img = makeImageData([255, 255, 255, 255], 1, 1);
    // Sample outside bounds
    const result = sampleCircleAverage(img, 100, 100, 1);
    expect(result).toEqual([0, 0, 0, 255]);
  });

  it('averages all pixels in a uniform 2x2 solid red image', () => {
    const img = makeImageData(
      [255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255],
      2,
      2
    );
    const [r, g, b] = sampleCircleAverage(img, 0, 0, 10);
    expect(r).toBeCloseTo(255);
    expect(g).toBeCloseTo(0);
    expect(b).toBeCloseTo(0);
  });

  it('averages colors correctly for a mixed 2x1 image', () => {
    // Left pixel: red, Right pixel: blue — sample across both
    const img = makeImageData([255, 0, 0, 255, 0, 0, 255, 255], 2, 1);
    const [r, , b] = sampleCircleAverage(img, 0.5, 0, 10);
    expect(r).toBeCloseTo(127.5, 0);
    expect(b).toBeCloseTo(127.5, 0);
  });

  it('only includes pixels within the circle radius', () => {
    // 3x1 row: red, green, blue — sample only the center pixel with radius < 1
    const img = makeImageData([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255], 3, 1);
    const [r, g, b] = sampleCircleAverage(img, 1, 0, 0);
    expect(r).toBeCloseTo(0);
    expect(g).toBeCloseTo(255);
    expect(b).toBeCloseTo(0);
  });

  it('clips sampling to image bounds (no out-of-bounds access)', () => {
    const img = makeImageData([128, 64, 32, 255], 1, 1);
    // Radius extends well beyond image — should not throw
    expect(() => sampleCircleAverage(img, 0, 0, 100)).not.toThrow();
  });
});

function makeRealImageData(pixels: number[], width: number, height: number): ImageData {
  return new ImageData(new Uint8ClampedArray(pixels), width, height);
}

const filter = (type: FilterInstance['type'], params: FilterInstance['params']): FilterInstance => ({
  id: 'f1',
  type,
  params,
});

describe('applyFilters', () => {
  it('returns the same ImageData when filters array is empty', () => {
    const img = makeRealImageData([100, 150, 200, 255], 1, 1);
    const result = applyFilters(img, []);
    expect(result.data[0]).toBe(100);
  });

  it('brightness-contrast: increases brightness', () => {
    const img = makeRealImageData([100, 100, 100, 255], 1, 1);
    const result = applyFilters(img, [filter('brightness-contrast', { brightness: 50, contrast: 0 })]);
    expect(result.data[0]).toBeGreaterThan(100);
  });

  it('hue-saturation: applying zero values leaves pixels unchanged', () => {
    const img = makeRealImageData([200, 100, 50, 255], 1, 1);
    const result = applyFilters(img, [filter('hue-saturation', { hue: 0, saturation: 0, lightness: 0 })]);
    expect(result.data[0]).toBe(200);
    expect(result.data[1]).toBe(100);
    expect(result.data[2]).toBe(50);
  });

  it('levels: black point clipping darkens shadow pixels to 0', () => {
    const img = makeRealImageData([50, 50, 50, 255], 1, 1);
    const result = applyFilters(img, [filter('levels', { blackPoint: 60, whitePoint: 255 })]);
    expect(result.data[0]).toBe(0);
  });

  it('applies multiple filters in sequence', () => {
    const img = makeRealImageData([128, 128, 128, 255], 1, 1);
    const result = applyFilters(img, [
      filter('brightness-contrast', { brightness: 20, contrast: 0 }),
      filter('levels', { blackPoint: 0, whitePoint: 200 }),
    ]);
    expect(result.data[0]).toBeGreaterThan(128);
  });
});
