import { describe, it, expect } from 'vitest';
import { rgbToHex, hexToRgb } from './colorUtils';

describe('rgbToHex', () => {
  it('converts pure red', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
  });

  it('converts pure green', () => {
    expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
  });

  it('converts pure blue', () => {
    expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
  });

  it('converts black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts white', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('converts an arbitrary color', () => {
    expect(rgbToHex(128, 64, 192)).toBe('#8040c0');
  });

  it('rounds fractional channel values', () => {
    expect(rgbToHex(254.6, 0.4, 127.5)).toBe('#ff0080');
  });
});

describe('hexToRgb', () => {
  it('parses pure red', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
  });

  it('parses pure green', () => {
    expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
  });

  it('parses pure blue', () => {
    expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
  });

  it('parses black', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
  });

  it('parses white', () => {
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
  });

  it('parses an arbitrary color', () => {
    expect(hexToRgb('#8040c0')).toEqual([128, 64, 192]);
  });

  it('accepts uppercase hex', () => {
    expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
  });

  it('accepts hex without leading #', () => {
    expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
  });
});

describe('rgbToHex / hexToRgb round-trip', () => {
  const cases: [number, number, number][] = [
    [0, 0, 0],
    [255, 255, 255],
    [255, 0, 0],
    [0, 128, 255],
    [123, 45, 67],
  ];

  for (const [r, g, b] of cases) {
    it(`round-trips rgb(${r}, ${g}, ${b})`, () => {
      expect(hexToRgb(rgbToHex(r, g, b))).toEqual([r, g, b]);
    });
  }
});

import { rgbToLab, deltaELab, labMidpoint, normalizeHex, isUsableColor } from './colorUtils';

describe('rgbToLab', () => {
  it('maps black to L=0', () => {
    const [l] = rgbToLab(0, 0, 0);
    expect(l).toBeCloseTo(0, 0);
  });

  it('maps white to L≈100', () => {
    const [l] = rgbToLab(255, 255, 255);
    expect(l).toBeCloseTo(100, 0);
  });

  it('returns a 3-tuple', () => {
    const result = rgbToLab(128, 64, 192);
    expect(result).toHaveLength(3);
    result.forEach((v) => expect(typeof v).toBe('number'));
  });
});

describe('deltaELab', () => {
  it('returns 0 for identical colors', () => {
    const lab: [number, number, number] = [50, 20, -10];
    expect(deltaELab(lab, lab)).toBe(0);
  });

  it('is symmetric', () => {
    const a: [number, number, number] = [50, 10, -5];
    const b: [number, number, number] = [60, 20, 5];
    expect(deltaELab(a, b)).toBeCloseTo(deltaELab(b, a), 10);
  });
});

describe('labMidpoint', () => {
  it('returns the midpoint of two Lab values', () => {
    const a: [number, number, number] = [0, 0, 0];
    const b: [number, number, number] = [100, 20, -40];
    expect(labMidpoint(a, b)).toEqual([50, 10, -20]);
  });
});

describe('normalizeHex', () => {
  it('expands 3-digit shorthand', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc');
  });

  it('passes through a full 6-digit hex unchanged', () => {
    expect(normalizeHex('#ff0080')).toBe('#ff0080');
  });
});

describe('isUsableColor', () => {
  it('returns false for near-black', () => {
    expect(isUsableColor('#0d0d0d')).toBe(false);
  });

  it('returns false for near-white', () => {
    expect(isUsableColor('#f5f5f5')).toBe(false);
  });

  it('returns false for neutral gray (no saturation)', () => {
    expect(isUsableColor('#808080')).toBe(false);
  });

  it('returns true for a vivid mid-tone color', () => {
    expect(isUsableColor('#e05050')).toBe(true);
  });
});
