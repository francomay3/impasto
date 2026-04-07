// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MarqueeController } from './MarqueeController';
import type { MarqueeRect } from './MarqueeController';

const makeRect = (): DOMRect =>
  ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => {} } as DOMRect);

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MarqueeController startDrag()', () => {
  it('remains idle until mousemove exceeds 4px threshold', () => {
    const ctrl = new MarqueeController(vi.fn());
    ctrl.startDrag(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }), makeRect());
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 12, clientY: 10 }));
    expect(ctrl.getState()).toEqual({ type: 'idle' });
  });

  it('enters dragging state after sufficient movement', () => {
    const ctrl = new MarqueeController(vi.fn());
    ctrl.startDrag(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }), makeRect());
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: 10 }));
    expect(ctrl.getState().type).toBe('dragging');
    expect(ctrl.isActive()).toBe(true);
  });

  it('tracks start and current coordinates while dragging', () => {
    const ctrl = new MarqueeController(vi.fn());
    ctrl.startDrag(new MouseEvent('mousedown', { clientX: 10, clientY: 15 }), makeRect());
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 30, clientY: 40 }));
    const state = ctrl.getState();
    expect(state.type).toBe('dragging');
    if (state.type === 'dragging') {
      expect(state.start).toEqual({ x: 10, y: 15 });
      expect(state.current).toEqual({ x: 30, y: 40 });
    }
  });

  it('returns to idle on mouseup', () => {
    const ctrl = new MarqueeController(vi.fn());
    ctrl.startDrag(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }), makeRect());
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 30, clientY: 30 }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 30, clientY: 30 }));
    expect(ctrl.getState()).toEqual({ type: 'idle' });
  });

  it('calls onCommit with the rect on mouseup after dragging', () => {
    const onCommit = vi.fn();
    const ctrl = new MarqueeController(onCommit);
    const rect = makeRect();
    ctrl.startDrag(new MouseEvent('mousedown', { clientX: 5, clientY: 10 }), rect);
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 60 }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 50, clientY: 60 }));
    expect(onCommit).toHaveBeenCalledOnce();
    const [committed] = onCommit.mock.calls[0] as [MarqueeRect, boolean, boolean];
    expect(committed.startX).toBe(5);
    expect(committed.startY).toBe(10);
    expect(committed.endX).toBe(50);
    expect(committed.endY).toBe(60);
    expect(committed.canvasRect).toBe(rect);
  });

  it('does NOT call onCommit when mouseup without sufficient drag', () => {
    const onCommit = vi.fn();
    const ctrl = new MarqueeController(onCommit);
    ctrl.startDrag(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }), makeRect());
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 11, clientY: 10 }));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('passes shiftKey and altKey to onCommit', () => {
    const onCommit = vi.fn();
    const ctrl = new MarqueeController(onCommit);
    ctrl.startDrag(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }), makeRect());
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 50, clientY: 50, shiftKey: true }));
    const [, shiftKey, altKey] = onCommit.mock.calls[0] as [MarqueeRect, boolean, boolean];
    expect(shiftKey).toBe(true);
    expect(altKey).toBe(false);
  });

  it('stays idle if a pending rAF fires after mouseup (regression: rect stuck on screen)', () => {
    let pendingRaf: FrameRequestCallback | null = null;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { pendingRaf = cb; return 0; });
    const ctrl = new MarqueeController(vi.fn());
    ctrl.startDrag(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }), makeRect());
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));
    expect(pendingRaf).not.toBeNull();
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 50, clientY: 50 }));
    expect(ctrl.getState()).toEqual({ type: 'idle' });
    pendingRaf!(0);
    expect(ctrl.getState()).toEqual({ type: 'idle' });
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
  });

  it('ignores startDrag while already dragging', () => {
    const onCommit = vi.fn();
    const ctrl = new MarqueeController(onCommit);
    ctrl.startDrag(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }), makeRect());
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));
    ctrl.startDrag(new MouseEvent('mousedown', { clientX: 20, clientY: 20 }), makeRect());
    const state = ctrl.getState();
    expect(state.type).toBe('dragging');
    if (state.type === 'dragging') {
      expect(state.start).toEqual({ x: 0, y: 0 });
    }
  });
});
