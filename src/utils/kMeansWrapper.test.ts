import { describe, it, expect } from 'vitest';
import { quantizeImage } from './kMeansWrapper';

function makeImageData(pixels: number[], width: number, height: number): ImageData {
  return { data: new Uint8ClampedArray(pixels), width, height } as unknown as ImageData;
}

describe('quantizeImage', () => {
  it('returns empty array when pixel count is less than k', () => {
    // 1 pixel, k=5 → 1 sample < 5
    const img = makeImageData([255, 0, 0, 255], 1, 1);
    expect(quantizeImage(img, 5, [])).toEqual([]);
  });

  it('returns k colors for a valid image', () => {
    // 4x4 image alternating red and blue (enough pixels for k=2)
    const pixels: number[] = [];
    for (let i = 0; i < 16; i++) {
      pixels.push(i % 2 === 0 ? 255 : 0, 0, i % 2 === 0 ? 0 : 255, 255);
    }
    const img = makeImageData(pixels, 4, 4);
    const result = quantizeImage(img, 2, []);
    expect(result).toHaveLength(2);
  });

  it('each returned color has the expected shape', () => {
    const pixels: number[] = [];
    for (let i = 0; i < 16; i++) pixels.push(100, 150, 200, 255);
    const img = makeImageData(pixels, 4, 4);
    const [color] = quantizeImage(img, 1, []);
    expect(typeof color.id).toBe('string');
    expect(color.hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(typeof color.ratio).toBe('number');
    expect(color.locked).toBe(false);
  });
});
