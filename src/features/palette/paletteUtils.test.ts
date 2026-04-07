import { describe, it, expect } from 'vitest';
import { createGroupEntry, getUngroupedColors } from './paletteUtils';
import type { Color, ColorGroup } from '../../types';

const makeColor = (id: string, groupId?: string): Color => ({
  id,
  hex: '#aabbcc',
  locked: false,
  ratio: 10,
  mixRecipe: '',
  groupId,
});

describe('createGroupEntry', () => {
  it('returns an object with id and name', () => {
    const entry = createGroupEntry(0);
    expect(typeof entry.id).toBe('string');
    expect(entry.name).toBe('Group 1');
  });

  it('increments group number by count + 1', () => {
    expect(createGroupEntry(3).name).toBe('Group 4');
  });

  it('generates a unique id each call', () => {
    const a = createGroupEntry(0);
    const b = createGroupEntry(0);
    expect(a.id).not.toBe(b.id);
  });
});

describe('getUngroupedColors', () => {
  const groups: ColorGroup[] = [{ id: 'g1', name: 'Warm' }];

  it('returns colors with no groupId', () => {
    const palette = [makeColor('c1'), makeColor('c2', 'g1')];
    const result = getUngroupedColors(palette, groups);
    expect(result.map((c) => c.id)).toEqual(['c1']);
  });

  it('returns colors whose groupId references a missing group', () => {
    const palette = [makeColor('c1', 'missing')];
    const result = getUngroupedColors(palette, groups);
    expect(result.map((c) => c.id)).toEqual(['c1']);
  });

  it('returns empty array when all colors are in known groups', () => {
    const palette = [makeColor('c1', 'g1')];
    expect(getUngroupedColors(palette, groups)).toHaveLength(0);
  });
});
