import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { applyFilters } from './imageProcessing';
import type { FilterInstance } from '../types';

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

function img(pixels: number[]): ImageData {
  return new ImageData(new Uint8ClampedArray(pixels), 1, 1);
}

const f = (type: FilterInstance['type'], params: FilterInstance['params']): FilterInstance =>
  ({ id: 'f1', type, params });

describe('applyFilters', () => {
  it('returns the same ImageData when filters array is empty', () => {
    const i = img([100, 150, 200, 255]);
    expect(applyFilters(i, []).data[0]).toBe(100);
  });

  it('skips disabled filters', () => {
    const i = img([100, 100, 100, 255]);
    const disabled: FilterInstance = { ...f('brightness-contrast', { brightness: 100, contrast: 0 }), enabled: false };
    expect(applyFilters(i, [disabled]).data[0]).toBe(100);
  });

  it('brightness-contrast: increases brightness', () => {
    const i = img([100, 100, 100, 255]);
    expect(applyFilters(i, [f('brightness-contrast', { brightness: 50, contrast: 0 })]).data[0]).toBeGreaterThan(100);
  });

  it('hue-saturation: zero values leave pixels unchanged', () => {
    const i = img([200, 100, 50, 255]);
    const result = applyFilters(i, [f('hue-saturation', { hue: 0, saturation: 0, lightness: 0 })]);
    expect(result.data[0]).toBe(200);
    expect(result.data[1]).toBe(100);
    expect(result.data[2]).toBe(50);
  });

  it('white-balance: zero temperature and tint leaves pixels unchanged', () => {
    const i = img([180, 120, 60, 255]);
    const result = applyFilters(i, [f('white-balance', { temperature: 0, tint: 0 })]);
    expect(result.data[0]).toBe(180);
    expect(result.data[1]).toBe(120);
    expect(result.data[2]).toBe(60);
  });

  it('vibrance: zero values leave pixels unchanged', () => {
    const i = img([200, 100, 50, 255]);
    expect(applyFilters(i, [f('vibrance', { vibrance: 0, saturation: 0 })]).data[0]).toBe(200);
  });

  it('color-balance: zero adjustments leave pixels unchanged', () => {
    const i = img([150, 100, 80, 255]);
    const p = { shadowsR: 0, shadowsG: 0, shadowsB: 0, midtonesR: 0, midtonesG: 0, midtonesB: 0, highlightsR: 0, highlightsG: 0, highlightsB: 0, preserveLuminosity: 0 };
    expect(applyFilters(i, [f('color-balance', p)]).data[0]).toBe(150);
  });

  it('levels: black point clipping darkens shadow pixels to 0', () => {
    const i = img([50, 50, 50, 255]);
    expect(applyFilters(i, [f('levels', { blackPoint: 60, whitePoint: 255 })]).data[0]).toBe(0);
  });

  it('blur: blur=0 returns image unchanged', () => {
    const i = img([200, 100, 50, 255]);
    expect(applyFilters(i, [f('blur', { blur: 0 })])).toBe(i);
  });

  it('unknown filter type passes through unchanged', () => {
    const i = img([77, 88, 99, 255]);
    const unknown = { id: 'x', type: 'unknown' as FilterInstance['type'], params: { brightness: 0, contrast: 0 } };
    expect(applyFilters(i, [unknown]).data[0]).toBe(77);
  });

  it('applies multiple filters in sequence', () => {
    const i = img([128, 128, 128, 255]);
    const result = applyFilters(i, [
      f('brightness-contrast', { brightness: 20, contrast: 0 }),
      f('levels', { blackPoint: 0, whitePoint: 200 }),
    ]);
    expect(result.data[0]).toBeGreaterThan(128);
  });
});
