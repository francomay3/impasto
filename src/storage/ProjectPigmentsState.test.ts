import { describe, expect, it, vi } from 'vitest';
import { ProjectPigmentsState } from './ProjectPigmentsState';
import type { PigmentSettings } from './impastoProjectDto';

const DEFAULTS: PigmentSettings = {
  enabledNames: ['Titanium White', 'Ivory Black', 'Cadmium Yellow'],
  minPaintPercent: 2,
  deltaThreshold: 4,
  usePigmentMatchedColors: false,
};

function makeState(overrides?: Partial<PigmentSettings>) {
  return new ProjectPigmentsState({ ...DEFAULTS, ...overrides });
}

describe('ProjectPigmentsState', () => {
  it('returns the initial settings from getSnapshot', () => {
    const state = makeState();
    expect(state.getSnapshot()).toEqual(DEFAULTS);
  });

  it('getSnapshot returns the same reference between mutations (stable for useSyncExternalStore)', () => {
    const state = makeState();
    expect(state.getSnapshot()).toBe(state.getSnapshot());
  });

  it('getSnapshot is frozen — external mutations are rejected', () => {
    const state = makeState();
    const snap = state.getSnapshot();
    expect(Object.isFrozen(snap)).toBe(true);
    expect(Object.isFrozen(snap.enabledNames)).toBe(true);
  });

  describe('togglePigment', () => {
    it('adds a pigment when enabling', () => {
      const state = makeState({ enabledNames: [] });
      state.togglePigment('Ivory Black', true);
      expect(state.getSnapshot().enabledNames).toContain('Ivory Black');
    });

    it('removes a pigment when disabling', () => {
      const state = makeState();
      state.togglePigment('Ivory Black', false);
      expect(state.getSnapshot().enabledNames).not.toContain('Ivory Black');
    });

    it('is a no-op when toggling an already-enabled pigment on', () => {
      const state = makeState();
      const before = state.getSnapshot();
      state.togglePigment('Titanium White', true);
      expect(state.getSnapshot()).toBe(before);
    });

    it('is a no-op when toggling an already-disabled pigment off', () => {
      const state = makeState({ enabledNames: [] });
      const before = state.getSnapshot();
      state.togglePigment('Titanium White', false);
      expect(state.getSnapshot()).toBe(before);
    });
  });

  describe('setMinPaintPercent', () => {
    it('updates minPaintPercent', () => {
      const state = makeState();
      state.setMinPaintPercent(10);
      expect(state.getSnapshot().minPaintPercent).toBe(10);
    });
  });

  describe('setDeltaThreshold', () => {
    it('updates deltaThreshold', () => {
      const state = makeState();
      state.setDeltaThreshold(8);
      expect(state.getSnapshot().deltaThreshold).toBe(8);
    });
  });

  describe('setUsePigmentMatchedColors', () => {
    it('updates the flag and ignores duplicate values', () => {
      const state = makeState();
      const l = vi.fn();
      state.subscribe(l);
      state.setUsePigmentMatchedColors(true);
      expect(state.getSnapshot().usePigmentMatchedColors).toBe(true);
      expect(l).toHaveBeenCalledTimes(1);
      state.setUsePigmentMatchedColors(true);
      expect(l).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadSettings', () => {
    it('replaces all settings', () => {
      const state = makeState();
      state.loadSettings({
        enabledNames: ['Cobalt Blue'],
        minPaintPercent: 5,
        deltaThreshold: 3,
        usePigmentMatchedColors: true,
      });
      expect(state.getSnapshot()).toEqual({
        enabledNames: ['Cobalt Blue'],
        minPaintPercent: 5,
        deltaThreshold: 3,
        usePigmentMatchedColors: true,
      });
    });
  });

  describe('reset', () => {
    it('restores constructor defaults', () => {
      const state = makeState();
      state.setMinPaintPercent(99);
      state.togglePigment('Titanium White', false);
      state.reset();
      expect(state.getSnapshot()).toEqual(DEFAULTS);
    });
  });

  describe('subscribe', () => {
    it('notifies listener on each mutation', () => {
      const state = makeState();
      const listener = vi.fn();
      state.subscribe(listener);
      state.togglePigment('Ivory Black', false);
      state.setMinPaintPercent(5);
      state.setDeltaThreshold(2);
      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('unsubscribe stops notifications', () => {
      const state = makeState();
      const listener = vi.fn();
      const unsub = state.subscribe(listener);
      unsub();
      state.setMinPaintPercent(99);
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
