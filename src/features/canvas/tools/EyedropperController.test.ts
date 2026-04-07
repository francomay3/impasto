import { describe, it, expect, vi } from 'vitest';
import { EyedropperController } from './EyedropperController';
import type { EyedropperEngineAdapter, EyedropperResult } from './EyedropperController';

function makeEngine(hex = '#ff8000'): EyedropperEngineAdapter {
  return { getColorAt: vi.fn(() => hex) };
}

describe('EyedropperController', () => {
  it('starts in idle state', () => {
    const ctrl = new EyedropperController(makeEngine(), vi.fn());
    expect(ctrl.getState()).toEqual({ type: 'idle' });
    expect(ctrl.isActive()).toBe(false);
  });

  it('activate() enters adding_color state', () => {
    const ctrl = new EyedropperController(makeEngine(), vi.fn());
    ctrl.activate();
    expect(ctrl.getState()).toEqual({ type: 'adding_color' });
    expect(ctrl.isActive()).toBe(true);
  });

  it('startSamplingColor() enters sampling_color state', () => {
    const ctrl = new EyedropperController(makeEngine(), vi.fn());
    ctrl.startSamplingColor('color-1');
    expect(ctrl.getState()).toEqual({ type: 'sampling_color', colorId: 'color-1' });
    expect(ctrl.isActive()).toBe(true);
  });

  it('startSamplingLevels() enters sampling_levels state', () => {
    const ctrl = new EyedropperController(makeEngine(), vi.fn());
    ctrl.startSamplingLevels('filter-1', 'black');
    expect(ctrl.getState()).toEqual({ type: 'sampling_levels', filterId: 'filter-1', point: 'black' });
  });

  describe('sample()', () => {
    it('is a no-op when idle', () => {
      const onSample = vi.fn();
      const engine = makeEngine();
      const ctrl = new EyedropperController(engine, onSample);
      ctrl.sample(100, 200);
      expect(onSample).not.toHaveBeenCalled();
      expect(engine.getColorAt).not.toHaveBeenCalled();
    });

    it('emits new_color result and returns to idle after activate()', () => {
      const onSample = vi.fn();
      const ctrl = new EyedropperController(makeEngine('#aabbcc'), onSample);
      ctrl.activate();
      ctrl.sample(50, 75);
      expect(ctrl.getState()).toEqual({ type: 'idle' });
      const result = onSample.mock.calls[0][0] as EyedropperResult;
      expect(result.type).toBe('new_color');
      expect(result.hex).toBe('#aabbcc');
      expect(result.sample).toEqual({ x: 50, y: 75, radius: 30 });
    });

    it('emits sample_color result with colorId after startSamplingColor()', () => {
      const onSample = vi.fn();
      const ctrl = new EyedropperController(makeEngine('#123456'), onSample);
      ctrl.startSamplingColor('color-42');
      ctrl.sample(10, 20);
      const result = onSample.mock.calls[0][0] as EyedropperResult;
      expect(result.type).toBe('sample_color');
      if (result.type === 'sample_color') {
        expect(result.colorId).toBe('color-42');
        expect(result.hex).toBe('#123456');
      }
    });

    it('emits sample_levels result with filterId and point after startSamplingLevels()', () => {
      const onSample = vi.fn();
      const ctrl = new EyedropperController(makeEngine('#ffffff'), onSample);
      ctrl.startSamplingLevels('filter-99', 'white');
      ctrl.sample(5, 5);
      const result = onSample.mock.calls[0][0] as EyedropperResult;
      expect(result.type).toBe('sample_levels');
      if (result.type === 'sample_levels') {
        expect(result.filterId).toBe('filter-99');
        expect(result.point).toBe('white');
        expect(result.hex).toBe('#ffffff');
      }
    });

    it('uses the current radius when sampling', () => {
      const engine = makeEngine();
      const ctrl = new EyedropperController(engine, vi.fn());
      ctrl.setRadius(60);
      ctrl.activate();
      ctrl.sample(100, 100);
      expect(engine.getColorAt).toHaveBeenCalledWith(100, 100, 60);
    });
  });

  describe('cancel()', () => {
    it('returns to idle and calls onCancel', () => {
      const onCancel = vi.fn();
      const ctrl = new EyedropperController(makeEngine(), vi.fn(), onCancel);
      ctrl.activate();
      ctrl.cancel();
      expect(ctrl.getState()).toEqual({ type: 'idle' });
      expect(onCancel).toHaveBeenCalledOnce();
    });

    it('works without an onCancel callback', () => {
      const ctrl = new EyedropperController(makeEngine(), vi.fn());
      ctrl.activate();
      expect(() => ctrl.cancel()).not.toThrow();
      expect(ctrl.getState()).toEqual({ type: 'idle' });
    });
  });

  describe('setRadius()', () => {
    it('updates the radius', () => {
      const ctrl = new EyedropperController(makeEngine(), vi.fn());
      ctrl.setRadius(80);
      expect(ctrl.getRadius()).toBe(80);
    });

    it('clamps to a minimum of 1', () => {
      const ctrl = new EyedropperController(makeEngine(), vi.fn());
      ctrl.setRadius(0);
      expect(ctrl.getRadius()).toBe(1);
    });
  });

  describe('subscribe()', () => {
    it('notifies listener on state change', () => {
      const listener = vi.fn();
      const ctrl = new EyedropperController(makeEngine(), vi.fn());
      ctrl.subscribe(listener);
      ctrl.activate();
      expect(listener).toHaveBeenCalledOnce();
    });

    it('unsubscribes correctly', () => {
      const listener = vi.fn();
      const ctrl = new EyedropperController(makeEngine(), vi.fn());
      const unsub = ctrl.subscribe(listener);
      unsub();
      ctrl.activate();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
