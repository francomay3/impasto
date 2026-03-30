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
