import { describe, it, expect, vi } from 'vitest';
import { ColorPinGroupState } from './ColorPinGroupState';

describe('ColorPinGroupState', () => {
  describe('getAll', () => {
    it('returns empty array initially', () => {
      const state = new ColorPinGroupState();
      expect(state.getAll()).toEqual([]);
    });
  });

  describe('subscribe / unsubscribe', () => {
    it('calls listener when groups change', () => {
      const state = new ColorPinGroupState();
      const listener = vi.fn();
      state.subscribe(listener);
      state.add('Group A');
      expect(listener).toHaveBeenCalledOnce();
    });

    it('stops calling listener after unsubscribe', () => {
      const state = new ColorPinGroupState();
      const listener = vi.fn();
      const unsub = state.subscribe(listener);
      unsub();
      state.add('Group A');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('add', () => {
    it('adds a group without color', () => {
      const state = new ColorPinGroupState();
      const id = state.add('Group A');
      const [group] = state.getAll();
      expect(group).toEqual({ id, label: 'Group A' });
      expect('color' in group!).toBe(false);
    });

    it('adds a group with color', () => {
      const state = new ColorPinGroupState();
      const id = state.add('Group A', '#ff0000');
      expect(state.getAll()).toEqual([{ id, label: 'Group A', color: '#ff0000' }]);
    });

    it('returns unique ids for each call', () => {
      const state = new ColorPinGroupState();
      const id1 = state.add('A');
      const id2 = state.add('B');
      expect(id1).not.toBe(id2);
    });

    it('notifies listeners', () => {
      const state = new ColorPinGroupState();
      const listener = vi.fn();
      state.subscribe(listener);
      state.add('Group A');
      expect(listener).toHaveBeenCalledOnce();
    });

    it('freezes the added row', () => {
      const state = new ColorPinGroupState();
      state.add('A');
      expect(Object.isFrozen(state.getAll()[0])).toBe(true);
    });
  });

  describe('removeById', () => {
    it('removes an existing group and notifies', () => {
      const state = new ColorPinGroupState();
      const listener = vi.fn();
      const id = state.add('Group A');
      state.subscribe(listener);
      state.removeById(id);
      expect(state.getAll()).toEqual([]);
      expect(listener).toHaveBeenCalledOnce();
    });

    it('does nothing when id is not found', () => {
      const state = new ColorPinGroupState();
      const listener = vi.fn();
      state.subscribe(listener);
      state.removeById('non-existent');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('setLabel', () => {
    it('updates the label and notifies', () => {
      const state = new ColorPinGroupState();
      const id = state.add('Old');
      const listener = vi.fn();
      state.subscribe(listener);
      state.setLabel(id, 'New');
      expect(state.getAll()[0]!.label).toBe('New');
      expect(listener).toHaveBeenCalledOnce();
    });

    it('does not notify when label is unchanged', () => {
      const state = new ColorPinGroupState();
      const id = state.add('Same');
      const listener = vi.fn();
      state.subscribe(listener);
      state.setLabel(id, 'Same');
      expect(listener).not.toHaveBeenCalled();
    });

    it('does not notify when id is not found', () => {
      const state = new ColorPinGroupState();
      const listener = vi.fn();
      state.subscribe(listener);
      state.setLabel('ghost', 'Label');
      expect(listener).not.toHaveBeenCalled();
    });

    it('preserves optional color when updating label', () => {
      const state = new ColorPinGroupState();
      const id = state.add('A', '#abc');
      state.setLabel(id, 'B');
      expect(state.getAll()[0]).toEqual({ id, label: 'B', color: '#abc' });
    });

    it('freezes the updated row', () => {
      const state = new ColorPinGroupState();
      const id = state.add('A');
      state.setLabel(id, 'B');
      expect(Object.isFrozen(state.getAll()[0])).toBe(true);
    });
  });

  describe('clear', () => {
    it('removes all groups and notifies', () => {
      const state = new ColorPinGroupState();
      state.add('A');
      state.add('B');
      const listener = vi.fn();
      state.subscribe(listener);
      state.clear();
      expect(state.getAll()).toEqual([]);
      expect(listener).toHaveBeenCalledOnce();
    });

    it('does not notify when already empty', () => {
      const state = new ColorPinGroupState();
      const listener = vi.fn();
      state.subscribe(listener);
      state.clear();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('setAllGroups', () => {
    it('replaces groups with new list and notifies', () => {
      const state = new ColorPinGroupState();
      state.add('A');
      const listener = vi.fn();
      state.subscribe(listener);
      state.setAllGroups([{ id: 'x', label: 'X' }]);
      expect(state.getAll()).toEqual([{ id: 'x', label: 'X' }]);
      expect(listener).toHaveBeenCalledOnce();
    });

    it('does not notify when groups are identical', () => {
      const state = new ColorPinGroupState();
      state.add('A');
      const current = [...state.getAll()];
      const listener = vi.fn();
      state.subscribe(listener);
      state.setAllGroups(current);
      expect(listener).not.toHaveBeenCalled();
    });

    it('replaces with empty array and notifies', () => {
      const state = new ColorPinGroupState();
      state.add('A');
      const listener = vi.fn();
      state.subscribe(listener);
      state.setAllGroups([]);
      expect(state.getAll()).toEqual([]);
      expect(listener).toHaveBeenCalledOnce();
    });

    it('freezes all incoming rows', () => {
      const state = new ColorPinGroupState();
      state.setAllGroups([{ id: 'a', label: 'A', color: '#fff' }]);
      expect(Object.isFrozen(state.getAll()[0])).toBe(true);
    });

    it('preserves color on incoming rows', () => {
      const state = new ColorPinGroupState();
      state.setAllGroups([{ id: 'a', label: 'A', color: '#123' }]);
      expect(state.getAll()[0]).toEqual({ id: 'a', label: 'A', color: '#123' });
    });

    it('notifies when length differs from current', () => {
      const state = new ColorPinGroupState();
      state.add('A');
      state.add('B');
      const listener = vi.fn();
      state.subscribe(listener);
      state.setAllGroups([{ id: 'x', label: 'X' }]);
      expect(listener).toHaveBeenCalledOnce();
    });
  });
});
