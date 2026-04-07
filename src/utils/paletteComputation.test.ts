import { describe, it, expect } from 'vitest';
import { getValidPaletteHexes, computeLabPalette } from './paletteComputation';
import type { Color } from '../types';

const makeColor = (hex: string): Color => ({
  id: '1',
  hex,
  locked: false,
  ratio: 10,
  mixRecipe: '',
});

describe('getValidPaletteHexes', () => {
  it('returns hex values for valid colors', () => {
    const palette = [makeColor('#ff0000'), makeColor('#00ff00')];
    expect(getValidPaletteHexes(palette)).toEqual(['#ff0000', '#00ff00']);
  });

  it('skips invalid hex strings', () => {
    const palette = [makeColor('#ff0000'), makeColor('not-a-hex')];
    const result = getValidPaletteHexes(palette);
    expect(result).toEqual(['#ff0000']);
  });

  it('returns empty array for empty palette', () => {
    expect(getValidPaletteHexes([])).toEqual([]);
  });
});

describe('computeLabPalette', () => {
  it('returns one Lab entry per hex', () => {
    const result = computeLabPalette(['#ff0000', '#0000ff']);
    expect(result).toHaveLength(2);
    result.forEach((entry) => {
      expect(typeof entry.l).toBe('number');
      expect(typeof entry.a).toBe('number');
      expect(typeof entry.b).toBe('number');
    });
  });

  it('returns empty array for empty input', () => {
    expect(computeLabPalette([])).toEqual([]);
  });

  it('black maps to L ≈ 0', () => {
    const [{ l }] = computeLabPalette(['#000000']);
    expect(l).toBeCloseTo(0, 0);
  });

  it('white maps to L ≈ 100', () => {
    const [{ l }] = computeLabPalette(['#ffffff']);
    expect(l).toBeCloseTo(100, 0);
  });
});
