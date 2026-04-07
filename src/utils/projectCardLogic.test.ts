import { describe, it, expect } from 'vitest';
import { formatProjectDate, getProjectRoute } from './projectCardLogic';

describe('formatProjectDate', () => {
  it('formats an ISO date string to a locale date', () => {
    const result = formatProjectDate('2024-06-15T10:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('is consistent across calls for the same input', () => {
    const input = '2023-01-01T00:00:00Z';
    expect(formatProjectDate(input)).toBe(formatProjectDate(input));
  });
});

describe('getProjectRoute', () => {
  it('returns the project path with the given id', () => {
    expect(getProjectRoute('abc123')).toBe('/project/abc123');
  });

  it('works with any string id', () => {
    expect(getProjectRoute('my-project-id')).toBe('/project/my-project-id');
  });
});
