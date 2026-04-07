import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { sampleCircleAverage } from './imageProcessing';

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

function makeImageData(pixels: number[], width: number, height: number) {
  return { data: new Uint8ClampedArray(pixels), width, height } as unknown as ImageData;
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
    expect(sampleCircleAverage(img, 100, 100, 1)).toEqual([0, 0, 0, 255]);
  });

  it('averages all pixels in a uniform 2x2 solid red image', () => {
    const img = makeImageData(
      [255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255],
      2, 2
    );
    const [r, g, b] = sampleCircleAverage(img, 0, 0, 10);
    expect(r).toBeCloseTo(255);
    expect(g).toBeCloseTo(0);
    expect(b).toBeCloseTo(0);
  });

  it('averages colors correctly for a mixed 2x1 image', () => {
    const img = makeImageData([255, 0, 0, 255, 0, 0, 255, 255], 2, 1);
    const [r, , b] = sampleCircleAverage(img, 0.5, 0, 10);
    expect(r).toBeCloseTo(127.5, 0);
    expect(b).toBeCloseTo(127.5, 0);
  });

  it('only includes pixels within the circle radius', () => {
    const img = makeImageData([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255], 3, 1);
    const [r, g, b] = sampleCircleAverage(img, 1, 0, 0);
    expect(r).toBeCloseTo(0);
    expect(g).toBeCloseTo(255);
    expect(b).toBeCloseTo(0);
  });

  it('clips sampling to image bounds without throwing', () => {
    const img = makeImageData([128, 64, 32, 255], 1, 1);
    expect(() => sampleCircleAverage(img, 0, 0, 100)).not.toThrow();
  });
});
