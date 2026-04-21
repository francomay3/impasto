import { describe, expect, it } from 'vitest';
import { cappedDimensions, MAX_IMAGE_PIXELS } from './imageDimensions';

describe('cappedDimensions', () => {
  it('returns original dimensions when under the pixel cap', () => {
    expect(cappedDimensions(100, 100)).toEqual({ width: 100, height: 100 });
  });

  it('returns original dimensions at exactly the pixel cap', () => {
    // 2000 × 1000 = exactly MAX_IMAGE_PIXELS
    expect(cappedDimensions(2000, 1000)).toEqual({ width: 2000, height: 1000 });
  });

  it('scales down while preserving aspect ratio when over the cap', () => {
    // 4000 × 2000 = 8 MP, 4× over — scale = sqrt(2MP / 8MP) = 0.5
    const result = cappedDimensions(4000, 2000);
    expect(result.width * result.height).toBeLessThanOrEqual(MAX_IMAGE_PIXELS);
    expect(result.width / result.height).toBeCloseTo(4000 / 2000, 1);
  });

  it('respects a custom maxPixels override', () => {
    const result = cappedDimensions(1000, 1000, 100_000);
    expect(result.width * result.height).toBeLessThanOrEqual(100_000);
  });
});
