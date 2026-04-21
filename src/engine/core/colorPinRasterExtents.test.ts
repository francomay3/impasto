import { describe, it, expect } from 'vitest';
import { colorPinRasterExtentsFromImages } from './colorPinRasterExtents';
import { createRawImage } from '../../types';

const makeImage = (w: number, h: number) =>
  createRawImage(new Uint8ClampedArray(w * h * 4) as Uint8ClampedArray<ArrayBuffer>, w, h);

describe('colorPinRasterExtentsFromImages', () => {
  it('returns filtered extents when filtered image is valid', () => {
    const filtered = makeImage(800, 600);
    const source = makeImage(400, 300);
    expect(colorPinRasterExtentsFromImages(filtered, source)).toEqual({ width: 800, height: 600 });
  });

  it('falls back to source when filtered is null', () => {
    const source = makeImage(400, 300);
    expect(colorPinRasterExtentsFromImages(null, source)).toEqual({ width: 400, height: 300 });
  });

  it('returns null when both are null', () => {
    expect(colorPinRasterExtentsFromImages(null, null)).toBeNull();
  });

  it('falls back to source when filtered has zero width', () => {
    const filtered = makeImage(0, 600);
    const source = makeImage(400, 300);
    expect(colorPinRasterExtentsFromImages(filtered, source)).toEqual({ width: 400, height: 300 });
  });

  it('falls back to source when filtered has zero height', () => {
    const filtered = makeImage(800, 0);
    const source = makeImage(400, 300);
    expect(colorPinRasterExtentsFromImages(filtered, source)).toEqual({ width: 400, height: 300 });
  });

  it('returns null when source also has zero dimensions', () => {
    const filtered = makeImage(0, 0);
    const source = makeImage(0, 0);
    expect(colorPinRasterExtentsFromImages(filtered, source)).toBeNull();
  });

  it('returns null when source is null and filtered is invalid', () => {
    const filtered = makeImage(0, 300);
    expect(colorPinRasterExtentsFromImages(filtered, null)).toBeNull();
  });
});
