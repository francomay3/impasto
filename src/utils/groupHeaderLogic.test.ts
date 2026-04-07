import { describe, it, expect } from 'vitest';
import { areAllPinsHidden } from './groupHeaderLogic';

describe('areAllPinsHidden', () => {
  it('returns true when every id is in the hidden set', () => {
    const hidden = new Set(['a', 'b', 'c']);
    expect(areAllPinsHidden(['a', 'b'], hidden)).toBe(true);
  });

  it('returns false when some ids are not hidden', () => {
    const hidden = new Set(['a']);
    expect(areAllPinsHidden(['a', 'b'], hidden)).toBe(false);
  });

  it('returns false for an empty ids array', () => {
    expect(areAllPinsHidden([], new Set(['a']))).toBe(false);
  });

  it('returns false when nothing is hidden', () => {
    expect(areAllPinsHidden(['a', 'b'], new Set())).toBe(false);
  });
});
