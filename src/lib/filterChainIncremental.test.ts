import { describe, it, expect } from 'vitest';
import { findDirtyFilterIndex, filterChainsEqual } from './filterChainIncremental';
import type { FilterInstance } from '../types';

function makeFilter(type: string, params: object = {}): FilterInstance {
  return { id: type, type: type as FilterInstance['type'], params: params as FilterInstance['params'] };
}

describe('findDirtyFilterIndex', () => {
  it('returns 0 for two empty chains', () => {
    expect(findDirtyFilterIndex([], [])).toBe(0);
  });

  it('returns min length when one chain is a prefix of the other', () => {
    const a = [makeFilter('brightness')];
    const b = [makeFilter('brightness'), makeFilter('contrast')];
    expect(findDirtyFilterIndex(a, b)).toBe(1);
  });

  it('returns index of first type mismatch', () => {
    const prev = [makeFilter('brightness'), makeFilter('contrast')];
    const next = [makeFilter('brightness'), makeFilter('blur')];
    expect(findDirtyFilterIndex(prev, next)).toBe(1);
  });

  it('returns index of first params mismatch', () => {
    const prev = [makeFilter('brightness', { value: 1 }), makeFilter('contrast', { value: 1 })];
    const next = [makeFilter('brightness', { value: 1 }), makeFilter('contrast', { value: 2 })];
    expect(findDirtyFilterIndex(prev, next)).toBe(1);
  });

  it('returns chain length when chains are identical', () => {
    const chain = [makeFilter('brightness', { value: 1 })];
    expect(findDirtyFilterIndex(chain, chain)).toBe(1);
  });
});

describe('filterChainsEqual', () => {
  it('returns true for two empty chains', () => {
    expect(filterChainsEqual([], [])).toBe(true);
  });

  it('returns false when chains have different lengths', () => {
    const a = [makeFilter('brightness')];
    expect(filterChainsEqual(a, [])).toBe(false);
  });

  it('returns true for identical chains', () => {
    const chain = [makeFilter('brightness', { value: 1 }), makeFilter('contrast', { value: 0.5 })];
    expect(filterChainsEqual(chain, [...chain])).toBe(true);
  });

  it('returns false when a filter differs', () => {
    const a = [makeFilter('brightness', { value: 1 })];
    const b = [makeFilter('brightness', { value: 2 })];
    expect(filterChainsEqual(a, b)).toBe(false);
  });
});
