import { describe, it, expect } from 'vitest';
import type { ColorPin } from './ColorPinState';
import { orderedPinIdsByColorSimilarity } from './orderedPinIdsByColorSimilarity';

function pin(id: string, hex: string): ColorPin {
  return Object.freeze({
    id,
    imageX: 0,
    imageY: 0,
    radiusPx: 2,
    color: hex,
  });
}

describe('orderedPinIdsByColorSimilarity', () => {
  it('returns empty for no pins', () => {
    expect(orderedPinIdsByColorSimilarity([], [], {})).toEqual([]);
  });

  it('returns one id unchanged', () => {
    const p = pin('a', '#000000');
    expect(orderedPinIdsByColorSimilarity([p], [], {})).toEqual(['a']);
  });

  it('sorts ungrouped pins by similarity (matches sortByColorSimilarity order)', () => {
    const black = pin('k', '#000000');
    const white = pin('w', '#ffffff');
    const ids = orderedPinIdsByColorSimilarity([white, black], [], {});
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe('k');
    expect(ids[1]).toBe('w');
  });

  it('orders each group then ungrouped, following group list order', () => {
    const g1 = { id: 'g1' };
    const g2 = { id: 'g2' };
    const pA = pin('a', '#ff0000');
    const pB = pin('b', '#00ff00');
    const pC = pin('c', '#0000ff');
    const pD = pin('d', '#ffff00');
    const pins = [pD, pA, pC, pB];
    const assignments: Record<string, string> = { a: 'g1', b: 'g1', c: 'g2' };
    const ids = orderedPinIdsByColorSimilarity(pins, [g1, g2], assignments);
    expect(ids.slice(0, 2).sort()).toEqual(['a', 'b'].sort());
    expect(ids[2]).toBe('c');
    expect(ids[3]).toBe('d');
  });
});
