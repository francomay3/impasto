import { describe, it, expect } from 'vitest';
import { createRawImage } from './index';

function makeData(length = 4): Uint8ClampedArray<ArrayBuffer> {
  return new Uint8ClampedArray(length) as Uint8ClampedArray<ArrayBuffer>;
}

describe('createRawImage', () => {
  it('sets width and height correctly', () => {
    const img = createRawImage(makeData(), 640, 480);
    expect(img.width).toBe(640);
    expect(img.height).toBe(480);
  });

  it('stores the exact data reference passed in', () => {
    const data = makeData(12);
    const img = createRawImage(data, 1, 1);
    expect(img.data).toBe(data);
  });

  it('makes data non-enumerable so Object.keys does not include it', () => {
    const img = createRawImage(makeData(), 2, 2);
    expect(Object.keys(img)).not.toContain('data');
  });

  it('makes data non-enumerable so JSON.stringify omits it', () => {
    const img = createRawImage(makeData(4), 1, 1);
    const json = JSON.stringify(img);
    expect(json).not.toContain('data');
  });

  it('data is still accessible via direct property access', () => {
    const data = makeData(8);
    const img = createRawImage(data, 2, 1);
    expect(img.data).toBe(data);
  });

  it('data property descriptor is writable', () => {
    const img = createRawImage(makeData(), 1, 1);
    const desc = Object.getOwnPropertyDescriptor(img, 'data')!;
    expect(desc.writable).toBe(true);
  });

  it('data property descriptor is configurable', () => {
    const img = createRawImage(makeData(), 1, 1);
    const desc = Object.getOwnPropertyDescriptor(img, 'data')!;
    expect(desc.configurable).toBe(true);
  });

  it('spread operator does not include data', () => {
    const img = createRawImage(makeData(), 3, 3);
    const spread = { ...img };
    expect('data' in spread).toBe(false);
  });
});
