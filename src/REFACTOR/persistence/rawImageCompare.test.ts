import { describe, expect, it } from 'vitest';
import { createRawImage } from '../../types';
import { cloneRawImage, rawImageContentEquals } from './rawImageCompare';

describe('rawImageContentEquals', () => {
  it('handles null and identical references', () => {
    expect(rawImageContentEquals(null, null)).toBe(true);
    const a = createRawImage(new Uint8ClampedArray([1, 2, 3, 255]), 1, 1);
    expect(rawImageContentEquals(a, a)).toBe(true);
    expect(rawImageContentEquals(a, null)).toBe(false);
    expect(rawImageContentEquals(null, a)).toBe(false);
  });

  it('compares dimensions and pixel bytes', () => {
    const a = createRawImage(new Uint8ClampedArray([10, 20, 30, 255]), 1, 1);
    const b = createRawImage(new Uint8ClampedArray([10, 20, 30, 255]), 1, 1);
    const c = createRawImage(new Uint8ClampedArray([10, 20, 31, 255]), 1, 1);
    expect(rawImageContentEquals(a, b)).toBe(true);
    expect(rawImageContentEquals(a, c)).toBe(false);
    const wide = createRawImage(new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 255]), 2, 1);
    expect(rawImageContentEquals(a, wide)).toBe(false);
  });

  it('returns false when buffer lengths disagree for same nominal size', () => {
    const a = createRawImage(new Uint8ClampedArray([1, 2, 3, 255]), 1, 1);
    const b = { width: 1, height: 1, data: new Uint8ClampedArray(8) };
    expect(rawImageContentEquals(a, b as typeof a)).toBe(false);
  });
});

describe('cloneRawImage', () => {
  it('clones pixels and returns null for null input', () => {
    expect(cloneRawImage(null)).toBeNull();
    const src = createRawImage(new Uint8ClampedArray([5, 6, 7, 8]), 1, 1);
    const copy = cloneRawImage(src);
    expect(copy).not.toBe(src);
    expect(rawImageContentEquals(src, copy)).toBe(true);
    src.data[0] = 99;
    expect(rawImageContentEquals(src, copy)).toBe(false);
  });
});
