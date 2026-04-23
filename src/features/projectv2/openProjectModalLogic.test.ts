import { describe, expect, it } from 'vitest';
import { listProjectsForOpenModal } from './openProjectModalLogic';
import type { ProjectState } from '../../types';

const base = (id: string, name: string, updatedAt: string): ProjectState => ({
  id,
  name,
  orphaned: false,
  palette: [],
  groups: [],
  paletteSize: 8,
  filters: [],
  preIndexingBlur: 3,
  createdAt: '2000-01-01T00:00:00.000Z',
  updatedAt,
});

describe('listProjectsForOpenModal', () => {
  it('sorts by updatedAt descending', () => {
    const a = base('1', 'Old', '2020-01-01T00:00:00.000Z');
    const b = base('2', 'New', '2024-01-01T00:00:00.000Z');
    const c = base('3', 'Mid', '2022-01-01T00:00:00.000Z');
    expect(listProjectsForOpenModal([a, b, c], undefined, '')).toEqual([b, c, a]);
  });

  it('excludes the current project id', () => {
    const a = base('1', 'A', '2024-01-01T00:00:00.000Z');
    const b = base('2', 'B', '2023-01-01T00:00:00.000Z');
    expect(listProjectsForOpenModal([a, b], '1', '')).toEqual([b]);
  });

  it('is a no-op exclude when id is undefined', () => {
    const a = base('1', 'A', '2024-01-01T00:00:00.000Z');
    expect(listProjectsForOpenModal([a], undefined, '')).toEqual([a]);
  });

  it('filters by case-insensitive substring on name (trimmed query)', () => {
    const a = base('1', 'Apple Pie', '2024-01-01T00:00:00.000Z');
    const b = base('2', 'banana', '2023-01-01T00:00:00.000Z');
    expect(listProjectsForOpenModal([a, b], undefined, '  aPP ')).toEqual([a]);
  });

  it('returns [] when no matches', () => {
    const a = base('1', 'A', '2024-01-01T00:00:00.000Z');
    expect(listProjectsForOpenModal([a], undefined, 'z')).toEqual([]);
  });

  it('excludes orphaned projects (no source image yet)', () => {
    const ready = base('1', 'Ready', '2024-01-01T00:00:00.000Z');
    const orphan = { ...base('2', 'Empty', '2023-01-01T00:00:00.000Z'), orphaned: true };
    expect(listProjectsForOpenModal([ready, orphan], undefined, '')).toEqual([ready]);
  });
});
