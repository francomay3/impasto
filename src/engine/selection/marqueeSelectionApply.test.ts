import { describe, expect, it } from 'vitest';
import { applyMarqueeSelection } from './marqueeSelectionApply';

const pin = (id: string) => ({ kind: 'colorPin' as const, id });

describe('applyMarqueeSelection', () => {
  it('replace uses hit order', () => {
    const prev = [pin('a'), pin('b')];
    expect(applyMarqueeSelection(prev, ['c', 'a'], 'replace')).toEqual([pin('c'), pin('a')]);
  });

  it('add preserves prev then appends new', () => {
    const prev = [pin('a')];
    expect(applyMarqueeSelection(prev, ['b', 'a'], 'add')).toEqual([pin('a'), pin('b')]);
  });

  it('subtract removes hits', () => {
    const prev = [pin('a'), pin('b')];
    expect(applyMarqueeSelection(prev, ['a'], 'subtract')).toEqual([pin('b')]);
  });

  it('invert toggles hits only; leaves pins outside the rect', () => {
    const prev = [pin('a'), pin('b')];
    expect(applyMarqueeSelection(prev, ['a', 'c'], 'invert')).toEqual([pin('b'), pin('c')]);
  });

  it('invert with empty prior selects all hits', () => {
    expect(applyMarqueeSelection([], ['a', 'b'], 'invert')).toEqual([pin('a'), pin('b')]);
  });

  it('invert with empty hit list leaves selection unchanged', () => {
    const prev = [pin('a'), pin('b')];
    expect(applyMarqueeSelection(prev, [], 'invert')).toEqual([pin('a'), pin('b')]);
  });
});
