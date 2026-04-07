import { describe, it, expect } from 'vitest';
import {
  rgbToHsl,
  hslToRgb,
  hueSaturationPixel,
  whiteBalancePixel,
  vibrancePixel,
  colorBalancePixel,
} from './pixelMath';

describe('rgbToHsl / hslToRgb', () => {
  it('round-trips grey (achromatic) correctly', () => {
    const [h, s, l] = rgbToHsl(128, 128, 128);
    expect(h).toBe(0);
    expect(s).toBe(0);
    expect(l).toBeCloseTo(128 / 255, 2);
  });

  it('round-trips a saturated colour without significant loss', () => {
    const [h, s, l] = rgbToHsl(255, 0, 0);
    const [r, g, b] = hslToRgb(h, s, l);
    expect(r).toBeCloseTo(255, 0);
    expect(g).toBeCloseTo(0, 0);
    expect(b).toBeCloseTo(0, 0);
  });
});

describe('hueSaturationPixel', () => {
  it('returns unchanged values with neutral settings', () => {
    const [r, g, b] = hueSaturationPixel(100, 150, 200, 0, 0, 0);
    expect(r).toBeCloseTo(100, 0);
    expect(g).toBeCloseTo(150, 0);
    expect(b).toBeCloseTo(200, 0);
  });

  it('desaturates toward grey with saturation = -100', () => {
    const [r, g, b] = hueSaturationPixel(255, 0, 0, 0, -100, 0);
    expect(r).toBeCloseTo(g, 0);
    expect(g).toBeCloseTo(b, 0);
  });

  it('hue rotation of 180 inverts the hue', () => {
    // Red (hue ≈ 0) rotated 180° → cyan (hue ≈ 0.5)
    const [r, g, b] = hueSaturationPixel(255, 0, 0, 180, 0, 0);
    expect(g).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(r);
  });

  it('returns values in [0, 255]', () => {
    for (const [r, g, b] of [[0, 0, 0], [255, 255, 255], [128, 64, 192]]) {
      const result = hueSaturationPixel(r, g, b, 90, 50, -30);
      for (const ch of result) {
        expect(ch).toBeGreaterThanOrEqual(0);
        expect(ch).toBeLessThanOrEqual(255);
      }
    }
  });
});

describe('whiteBalancePixel', () => {
  it('positive temperature increases red and decreases blue', () => {
    const [r, , b] = whiteBalancePixel(128, 128, 128, 20, 0);
    expect(r).toBeGreaterThan(128);
    expect(b).toBeLessThan(128);
  });

  it('tint shifts the green channel', () => {
    const [, g] = whiteBalancePixel(128, 128, 128, 0, 15);
    expect(g).toBeGreaterThan(128);
  });

  it('returns values in [0, 255]', () => {
    const result = whiteBalancePixel(255, 255, 0, 50, -50);
    for (const ch of result) {
      expect(ch).toBeGreaterThanOrEqual(0);
      expect(ch).toBeLessThanOrEqual(255);
    }
  });
});

describe('vibrancePixel', () => {
  it('neutral settings leave pixel unchanged', () => {
    const [r, g, b] = vibrancePixel(200, 100, 50, 0, 0);
    expect(r).toBeCloseTo(200, 0);
    expect(g).toBeCloseTo(100, 0);
    expect(b).toBeCloseTo(50, 0);
  });

  it('positive vibrance increases spread of a desaturated pixel', () => {
    const before = [128, 120, 115] as const;
    const after = vibrancePixel(before[0], before[1], before[2], 100, 0);
    const beforeSpread = before[0] - before[2];
    const afterSpread = Math.max(...after) - Math.min(...after);
    expect(afterSpread).toBeGreaterThan(beforeSpread);
  });

  it('returns values in [0, 255]', () => {
    for (const [r, g, b] of [[0, 0, 0], [255, 255, 255], [200, 50, 80]]) {
      const result = vibrancePixel(r, g, b, 100, 100);
      for (const ch of result) {
        expect(ch).toBeGreaterThanOrEqual(0);
        expect(ch).toBeLessThanOrEqual(255);
      }
    }
  });
});

describe('colorBalancePixel', () => {
  it('zero shifts leave the pixel unchanged', () => {
    const [r, g, b] = colorBalancePixel(100, 150, 200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(r).toBe(100);
    expect(g).toBe(150);
    expect(b).toBe(200);
  });

  it('shadow shift affects dark pixels more than bright pixels', () => {
    const [r1] = colorBalancePixel(10, 10, 10, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    const [r2] = colorBalancePixel(245, 245, 245, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(r1).toBeGreaterThan(10);
    expect(r2).toBeCloseTo(245, 0);
  });

  it('preserve luminosity keeps perceived brightness unchanged', () => {
    const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;
    const [r, g, b] = colorBalancePixel(120, 120, 120, 80, 0, 0, 0, 0, 0, 0, 0, 0, 1);
    expect(lum(r, g, b)).toBeCloseTo(lum(120, 120, 120), 0);
  });

  it('returns values in [0, 255]', () => {
    const result = colorBalancePixel(50, 50, 50, 100, 100, 100, 100, 100, 100, 100, 100, 100, 1);
    for (const ch of result) {
      expect(ch).toBeGreaterThanOrEqual(0);
      expect(ch).toBeLessThanOrEqual(255);
    }
  });
});
