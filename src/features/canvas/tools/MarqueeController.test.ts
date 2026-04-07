// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MarqueeController } from './MarqueeController';

const makeRect = (): DOMRect =>
  ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => {} } as DOMRect);

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MarqueeController', () => {
  it('starts in idle state', () => {
    const ctrl = new MarqueeController(vi.fn());
    expect(ctrl.getState()).toEqual({ type: 'idle' });
    expect(ctrl.isActive()).toBe(false);
  });

  describe('cancel()', () => {
    it('returns to idle and calls onCancel', () => {
      const onCancel = vi.fn();
      const ctrl = new MarqueeController(vi.fn(), onCancel);
      ctrl.startDrag(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }), makeRect());
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));
      ctrl.cancel();
      expect(ctrl.getState()).toEqual({ type: 'idle' });
      expect(onCancel).toHaveBeenCalledOnce();
    });

    it('works without an onCancel callback', () => {
      const ctrl = new MarqueeController(vi.fn());
      expect(() => ctrl.cancel()).not.toThrow();
    });
  });

  describe('subscribe()', () => {
    it('notifies listener when state changes', () => {
      const listener = vi.fn();
      const ctrl = new MarqueeController(vi.fn());
      ctrl.subscribe(listener);
      ctrl.startDrag(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }), makeRect());
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));
      expect(listener).toHaveBeenCalled();
    });

    it('unsubscribes correctly', () => {
      const listener = vi.fn();
      const ctrl = new MarqueeController(vi.fn());
      const unsub = ctrl.subscribe(listener);
      unsub();
      ctrl.cancel();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
