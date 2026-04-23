import { describe, expect, it } from 'vitest';
import type { FilterInstance } from '../../types';
import { appendFilterWithType } from './addFilterAction';

describe('appendFilterWithType', () => {
  it('appends a filter with default params for the type', () => {
    const current: FilterInstance[] = [];
    const next = appendFilterWithType(current, 'blur', 'id-1');
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ id: 'id-1', type: 'blur', enabled: true });
    expect(next[0].params).toBeDefined();
    expect(current).toHaveLength(0);
  });
});
