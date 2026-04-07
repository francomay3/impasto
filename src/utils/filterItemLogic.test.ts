import { describe, it, expect } from 'vitest';
import { swapFilters } from './filterItemLogic';
import type { FilterInstance } from '../types';

const makeFilter = (id: string): FilterInstance => ({
  id,
  type: 'blur',
  params: { blur: 0 },
});

describe('swapFilters', () => {
  it('swaps two elements', () => {
    const filters = [makeFilter('a'), makeFilter('b'), makeFilter('c')];
    const result = swapFilters(filters, 0, 2);
    expect(result.map((f) => f.id)).toEqual(['c', 'b', 'a']);
  });

  it('returns a new array (does not mutate)', () => {
    const filters = [makeFilter('a'), makeFilter('b')];
    const result = swapFilters(filters, 0, 1);
    expect(result).not.toBe(filters);
    expect(filters[0].id).toBe('a');
  });

  it('swapping adjacent indices works', () => {
    const filters = [makeFilter('x'), makeFilter('y')];
    const result = swapFilters(filters, 0, 1);
    expect(result.map((f) => f.id)).toEqual(['y', 'x']);
  });

  it('swapping an element with itself is a no-op', () => {
    const filters = [makeFilter('a'), makeFilter('b')];
    const result = swapFilters(filters, 1, 1);
    expect(result.map((f) => f.id)).toEqual(['a', 'b']);
  });
});
