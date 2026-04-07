// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { applyDelta, RotateController } from './RotateController';

describe('applyDelta', () => {
  it('returns half rotation range when dragging half the container width', () => {
    expect(applyDelta(0, 100, 200)).toBe(90);
  });

  it('applies negative delta for leftward drag', () => {
    expect(applyDelta(0, -100, 200)).toBe(-90);
  });

  it('accumulates on top of current angle', () => {
    expect(applyDelta(45, 100, 200)).toBe(135);
  });

  it('returns current angle when dx is 0', () => {
    expect(applyDelta(30, 0, 200)).toBe(30);
  });
});

describe('RotateController', () => {
  describe('constructor', () => {
    it('uses the provided initial angle', () => {
      expect(new RotateController(45, vi.fn()).getAngle()).toBe(45);
    });

    it('defaults to 0 when no initial angle provided', () => {
      expect(new RotateController(undefined, vi.fn()).getAngle()).toBe(0);
    });
  });

  describe('reset', () => {
    it('resets to 0 and calls onChange when no argument', () => {
      const onChange = vi.fn();
      const ctrl = new RotateController(90, onChange);
      ctrl.reset();
      expect(ctrl.getAngle()).toBe(0);
      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('resets to given angle and calls onChange', () => {
      const onChange = vi.fn();
      const ctrl = new RotateController(0, onChange);
      ctrl.reset(45);
      expect(ctrl.getAngle()).toBe(45);
      expect(onChange).toHaveBeenCalledWith(45);
    });
  });

  describe('startDrag', () => {
    function makeContainer(width: number): HTMLElement {
      return { getBoundingClientRect: () => ({ width, left: 0, top: 0, right: width, bottom: 100, height: 100 }) } as HTMLElement;
    }

    it('updates angle on mousemove and calls onChange', () => {
      const onChange = vi.fn();
      const ctrl = new RotateController(0, onChange);
      const e = new MouseEvent('mousedown', { clientX: 100 });
      Object.defineProperty(e, 'preventDefault', { value: vi.fn() });

      ctrl.startDrag(e, makeContainer(200));
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200 }));

      expect(onChange).toHaveBeenCalledWith(90);
      expect(ctrl.getAngle()).toBe(90);
    });

    it('stops updating after mouseup', () => {
      const onChange = vi.fn();
      const ctrl = new RotateController(0, onChange);
      const e = new MouseEvent('mousedown', { clientX: 0 });
      Object.defineProperty(e, 'preventDefault', { value: vi.fn() });

      ctrl.startDrag(e, makeContainer(200));
      window.dispatchEvent(new MouseEvent('mouseup'));
      onChange.mockClear();

      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 }));
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
