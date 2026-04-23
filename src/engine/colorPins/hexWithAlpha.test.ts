import { describe, expect, it } from 'vitest';
import { hexWithAlpha } from './hexWithAlpha';

describe('hexWithAlpha', () => {
  it('maps #ff0000 with fractional alpha', () => {
    expect(hexWithAlpha('#ff0000', 0.15)).toBe('rgba(255, 0, 0, 0.15)');
  });

  it('maps #000000 with full opacity', () => {
    expect(hexWithAlpha('#000000', 1)).toBe('rgba(0, 0, 0, 1)');
  });

  it('maps #ffffff with zero alpha', () => {
    expect(hexWithAlpha('#ffffff', 0)).toBe('rgba(255, 255, 255, 0)');
  });
});
