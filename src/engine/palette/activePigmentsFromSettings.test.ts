import { describe, expect, it } from 'vitest';
import { PIGMENTS } from '../../services/ColorMixer';
import { activePigmentsFromSettings } from './activePigmentsFromSettings';

describe('activePigmentsFromSettings', () => {
  it('filters by enabledNames in catalog order', () => {
    const catalog = [
      { name: 'A', rgb: 'rgb(1,1,1)' },
      { name: 'B', rgb: 'rgb(2,2,2)' },
      { name: 'C', rgb: 'rgb(3,3,3)' },
    ] as const;
    const out = activePigmentsFromSettings(
      { enabledNames: ['C', 'A'], minPaintPercent: 2, deltaThreshold: 4, usePigmentMatchedColors: false },
      catalog,
    );
    expect(out.map((p) => p.name)).toEqual(['A', 'C']);
  });

  it('defaults catalog to PIGMENTS', () => {
    const first = PIGMENTS[0]!.name;
    const out = activePigmentsFromSettings({
      enabledNames: [first],
      minPaintPercent: 1,
      deltaThreshold: 1,
      usePigmentMatchedColors: false,
    });
    expect(out).toHaveLength(1);
    expect(out[0]!.name).toBe(first);
  });
});
