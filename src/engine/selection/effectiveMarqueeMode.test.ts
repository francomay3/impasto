import { describe, expect, it } from 'vitest';
import { effectiveMarqueeMode, type PointerModifierBits } from './effectiveMarqueeMode';

function m(partial: Partial<PointerModifierBits> = {}): PointerModifierBits {
  return {
    shiftKey: false,
    altKey: false,
    ...partial,
  };
}

describe('effectiveMarqueeMode', () => {
  it('Alt forces subtract regardless of UI', () => {
    expect(effectiveMarqueeMode('replace', m({ altKey: true }))).toBe('subtract');
    expect(effectiveMarqueeMode('add', m({ altKey: true }))).toBe('subtract');
  });

  it('Shift forces invert-within-marquee regardless of UI', () => {
    expect(effectiveMarqueeMode('replace', m({ shiftKey: true }))).toBe('invert');
    expect(effectiveMarqueeMode('subtract', m({ shiftKey: true }))).toBe('invert');
  });

  it('uses UI mode when no modifiers', () => {
    expect(effectiveMarqueeMode('subtract', m())).toBe('subtract');
    expect(effectiveMarqueeMode('add', m())).toBe('add');
  });

  it('Alt beats Shift', () => {
    expect(effectiveMarqueeMode('replace', m({ shiftKey: true, altKey: true }))).toBe('subtract');
  });
});
