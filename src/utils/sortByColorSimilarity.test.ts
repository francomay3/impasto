import { describe, it, expect } from 'vitest';
import { sortByColorSimilarity } from './sortByColorSimilarity';
import type { Color } from '../types';

function makeColor(hex: string): Color {
  return { id: hex, hex, locked: false, ratio: 0, mixRecipe: '' };
}

const BLACK  = makeColor('#000000'); // L ≈ 0
const DGRAY  = makeColor('#333333'); // L ≈ 22
const MGRAY  = makeColor('#666666'); // L ≈ 41
const LGRAY  = makeColor('#999999'); // L ≈ 62
const WHITE  = makeColor('#ffffff'); // L = 100

describe('sortByColorSimilarity', () => {
  it('returns an empty array unchanged', () => {
    expect(sortByColorSimilarity([])).toEqual([]);
  });

  it('returns a single-element array unchanged', () => {
    expect(sortByColorSimilarity([BLACK])).toEqual([BLACK]);
  });

  it('preserves all elements', () => {
    const input = [WHITE, DGRAY, BLACK, LGRAY, MGRAY];
    const result = sortByColorSimilarity(input);
    expect(result).toHaveLength(5);
    expect(result).toEqual(expect.arrayContaining(input));
  });

  it('starts with the darkest color', () => {
    const input = [WHITE, MGRAY, BLACK, LGRAY, DGRAY];
    const result = sortByColorSimilarity(input);
    expect(result[0].hex).toBe('#000000');
  });

  it('sorts a grayscale ramp darkest to lightest', () => {
    const input = [WHITE, DGRAY, BLACK, LGRAY, MGRAY];
    const result = sortByColorSimilarity(input);
    expect(result.map((c) => c.hex)).toEqual([
      '#000000',
      '#333333',
      '#666666',
      '#999999',
      '#ffffff',
    ]);
  });

  it('does not mutate the input array', () => {
    const input = [WHITE, BLACK, MGRAY];
    const copy = [...input];
    sortByColorSimilarity(input);
    expect(input).toEqual(copy);
  });
});
