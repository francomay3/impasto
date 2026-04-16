import { describe, expect, it } from 'vitest';
import { resolveColorPinContextScope } from './resolveColorPinContextScope';

const pin = (id: string) => ({ kind: 'colorPin' as const, id });

describe('resolveColorPinContextScope', () => {
  it('returns all selected color pins in order when anchor is selected', () => {
    const selection = [pin('a'), pin('b')];
    expect(resolveColorPinContextScope('b', selection)).toEqual(['a', 'b']);
  });

  it('returns only anchor when anchor is not in selection', () => {
    const selection = [pin('a')];
    expect(resolveColorPinContextScope('b', selection)).toEqual(['b']);
  });

  it('dedupes color pin ids by first occurrence in selection order', () => {
    const selection = [pin('a'), pin('a'), pin('b')];
    expect(resolveColorPinContextScope('a', selection)).toEqual(['a', 'b']);
  });

  it('empty selection scopes to clicked pin only', () => {
    expect(resolveColorPinContextScope('x', [])).toEqual(['x']);
  });
});
