import { describe, it, expect } from 'vitest';
import { getSelectionState, buildGroupOptions } from './selectionUtils';
import type { Color, ColorGroup } from '../types';

const makeColor = (id: string, groupId?: string, hasSample = false): Color => ({
  id,
  hex: '#ff0000',
  locked: false,
  ratio: 10,
  mixRecipe: '',
  groupId,
  sample: hasSample ? { x: 0, y: 0, radius: 5 } : undefined,
});

describe('getSelectionState', () => {
  it('canMerge is true for exactly 2 sampled colors', () => {
    const palette = [makeColor('a', undefined, true), makeColor('b', undefined, true)];
    const { canMerge } = getSelectionState(['a', 'b'], palette, new Set());
    expect(canMerge).toBe(true);
  });

  it('canMerge is false when fewer than 2 ids selected', () => {
    const palette = [makeColor('a', undefined, true)];
    const { canMerge } = getSelectionState(['a'], palette, new Set());
    expect(canMerge).toBe(false);
  });

  it('canMerge is false when a selected color has no sample', () => {
    const palette = [makeColor('a', undefined, true), makeColor('b')];
    const { canMerge } = getSelectionState(['a', 'b'], palette, new Set());
    expect(canMerge).toBe(false);
  });

  it('allHidden is true when all selected ids are hidden', () => {
    const palette = [makeColor('a'), makeColor('b')];
    const { allHidden } = getSelectionState(['a', 'b'], palette, new Set(['a', 'b']));
    expect(allHidden).toBe(true);
  });

  it('allHidden is false when some ids are not hidden', () => {
    const palette = [makeColor('a'), makeColor('b')];
    const { allHidden } = getSelectionState(['a', 'b'], palette, new Set(['a']));
    expect(allHidden).toBe(false);
  });

  it('currentGroupId is the shared group when all selected share one group', () => {
    const palette = [makeColor('a', 'g1'), makeColor('b', 'g1')];
    const { currentGroupId } = getSelectionState(['a', 'b'], palette, new Set());
    expect(currentGroupId).toBe('g1');
  });

  it('currentGroupId is __none__ when selected colors have no group', () => {
    const palette = [makeColor('a'), makeColor('b')];
    const { currentGroupId } = getSelectionState(['a', 'b'], palette, new Set());
    expect(currentGroupId).toBe('__none__');
  });

  it('currentGroupId is null when selected colors span different groups', () => {
    const palette = [makeColor('a', 'g1'), makeColor('b', 'g2')];
    const { currentGroupId } = getSelectionState(['a', 'b'], palette, new Set());
    expect(currentGroupId).toBeNull();
  });
});

describe('buildGroupOptions', () => {
  it('always prepends the no-group option', () => {
    const result = buildGroupOptions([]);
    expect(result[0]).toEqual({ value: '__none__', label: 'No group' });
  });

  it('maps groups to value/label pairs', () => {
    const groups: ColorGroup[] = [{ id: 'g1', name: 'Shadows' }];
    const result = buildGroupOptions(groups);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ value: 'g1', label: 'Shadows' });
  });
});
