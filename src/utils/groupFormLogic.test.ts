import { describe, it, expect } from 'vitest';
import { resolveGroupOnSave } from './groupFormLogic';

describe('resolveGroupOnSave', () => {
  it('returns existing groupId unchanged when not creating a group', () => {
    const result = resolveGroupOnSave(false, 'existing-id', 'ignored name');
    expect(result).toEqual({ finalGroupId: 'existing-id', newGroup: null });
  });

  it('returns null groupId unchanged when not creating a group', () => {
    const result = resolveGroupOnSave(false, null, '');
    expect(result).toEqual({ finalGroupId: null, newGroup: null });
  });

  it('returns null group when creating but name is blank', () => {
    const result = resolveGroupOnSave(true, null, '   ');
    expect(result).toEqual({ finalGroupId: null, newGroup: null });
  });

  it('creates a new group with trimmed name', () => {
    const result = resolveGroupOnSave(true, null, '  Shadows  ');
    expect(result.newGroup).not.toBeNull();
    expect(result.newGroup!.name).toBe('Shadows');
    expect(typeof result.newGroup!.id).toBe('string');
    expect(result.finalGroupId).toBe(result.newGroup!.id);
  });

  it('new group id matches finalGroupId', () => {
    const result = resolveGroupOnSave(true, null, 'Highlights');
    expect(result.finalGroupId).toBe(result.newGroup!.id);
  });
});
