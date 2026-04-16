import { describe, expect, it } from 'vitest';
import { impastoToolTooltipText } from './toolHotkeyLabels';

describe('impastoToolTooltipText', () => {
  it('returns non-empty lines for each built-in tool', () => {
    for (const id of ['pan', 'sample-color', 'marquee-select'] as const) {
      const text = impastoToolTooltipText(id);
      expect(text.length).toBeGreaterThan(0);
      expect(text.split('\n').every((line) => line.length > 0)).toBe(true);
    }
  });
});
