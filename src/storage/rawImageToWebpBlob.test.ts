// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { rawImageToWebpBlob } from './rawImageToWebpBlob';
import type { RawImage } from '../types';

// Minimal valid RawImage — canvas ops are not exercised in these tests (happy-dom has no Canvas 2D).
// Canvas encoding is a browser primitive; dimension-cap logic is covered in imageDimensions.test.ts.
function makeRawImage(width: number, height: number): RawImage {
  const size = Math.max(width * height, 0) * 4;
  return { data: new Uint8ClampedArray(size), width, height };
}

describe('rawImageToWebpBlob', () => {
  it('rejects zero width', async () => {
    await expect(rawImageToWebpBlob(makeRawImage(0, 100))).rejects.toThrow(
      'width and height must be positive',
    );
  });

  it('rejects negative height', async () => {
    await expect(rawImageToWebpBlob(makeRawImage(100, -1))).rejects.toThrow(
      'width and height must be positive',
    );
  });
});
