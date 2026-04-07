import { describe, it, expect, vi } from 'vitest';
import { applyDrag, CropController } from './CropController';

const center = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };

describe('applyDrag', () => {
  it('move translates the rect', () => {
    expect(applyDrag('move', center, 0.1, 0.1)).toEqual({ x: 0.35, y: 0.35, width: 0.5, height: 0.5 });
  });

  it('move clamps so rect stays within bounds', () => {
    expect(applyDrag('move', center, 1, 1)).toEqual({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 });
    expect(applyDrag('move', center, -1, -1)).toEqual({ x: 0, y: 0, width: 0.5, height: 0.5 });
  });

  it('nw handle moves top-left corner', () => {
    const r = applyDrag('nw', center, 0.1, 0.1);
    expect(r.x).toBeCloseTo(0.35);
    expect(r.y).toBeCloseTo(0.35);
    expect(r.width).toBeCloseTo(0.4);
    expect(r.height).toBeCloseTo(0.4);
  });

  it('se handle moves bottom-right corner', () => {
    const r = applyDrag('se', center, 0.1, 0.1);
    expect(r.x).toBeCloseTo(0.25);
    expect(r.y).toBeCloseTo(0.25);
    expect(r.width).toBeCloseTo(0.6);
    expect(r.height).toBeCloseTo(0.6);
  });

  it('ne handle moves top-right corner', () => {
    const r = applyDrag('ne', center, 0.1, -0.1);
    expect(r.x).toBeCloseTo(0.25);
    expect(r.y).toBeCloseTo(0.15);
    expect(r.width).toBeCloseTo(0.6);
    expect(r.height).toBeCloseTo(0.6);
  });

  it('sw handle moves bottom-left corner', () => {
    const r = applyDrag('sw', center, -0.1, 0.1);
    expect(r.x).toBeCloseTo(0.15);
    expect(r.y).toBeCloseTo(0.25);
    expect(r.width).toBeCloseTo(0.6);
    expect(r.height).toBeCloseTo(0.6);
  });

  it('n handle moves only top edge', () => {
    const r = applyDrag('n', center, 0.5, 0.1);
    expect(r.x).toBeCloseTo(0.25);
    expect(r.y).toBeCloseTo(0.35);
    expect(r.width).toBeCloseTo(0.5);
    expect(r.height).toBeCloseTo(0.4);
  });

  it('s handle moves only bottom edge', () => {
    const r = applyDrag('s', center, 0.5, 0.1);
    expect(r.x).toBeCloseTo(0.25);
    expect(r.y).toBeCloseTo(0.25);
    expect(r.width).toBeCloseTo(0.5);
    expect(r.height).toBeCloseTo(0.6);
  });

  it('e handle moves only right edge', () => {
    const r = applyDrag('e', center, 0.1, 0.5);
    expect(r.x).toBeCloseTo(0.25);
    expect(r.y).toBeCloseTo(0.25);
    expect(r.width).toBeCloseTo(0.6);
    expect(r.height).toBeCloseTo(0.5);
  });

  it('w handle moves only left edge', () => {
    const r = applyDrag('w', center, 0.1, 0.5);
    expect(r.x).toBeCloseTo(0.35);
    expect(r.y).toBeCloseTo(0.25);
    expect(r.width).toBeCloseTo(0.4);
    expect(r.height).toBeCloseTo(0.5);
  });

  it('enforces minimum size when dragging inward past limit', () => {
    const r = applyDrag('se', center, -0.6, -0.6);
    expect(r.width).toBeGreaterThanOrEqual(0.02);
    expect(r.height).toBeGreaterThanOrEqual(0.02);
  });

  it('clamps to image bounds when dragging outward', () => {
    const r = applyDrag('se', center, 1, 1);
    expect(r.x + r.width).toBeLessThanOrEqual(1);
    expect(r.y + r.height).toBeLessThanOrEqual(1);
  });
});

describe('CropController', () => {
  it('initializes with full rect by default', () => {
    const onChange = vi.fn();
    const ctrl = new CropController(undefined, onChange);
    expect(ctrl.getRect()).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('initializes with provided rect', () => {
    const onChange = vi.fn();
    const initial = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
    const ctrl = new CropController(initial, onChange);
    expect(ctrl.getRect()).toEqual(initial);
  });

  it('reset restores full rect and calls onChange', () => {
    const onChange = vi.fn();
    const ctrl = new CropController({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 }, onChange);
    ctrl.reset();
    expect(ctrl.getRect()).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    expect(onChange).toHaveBeenCalledWith({ x: 0, y: 0, width: 1, height: 1 });
  });

  it('reset with rect sets specific rect', () => {
    const onChange = vi.fn();
    const ctrl = new CropController(undefined, onChange);
    const newRect = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };
    ctrl.reset(newRect);
    expect(ctrl.getRect()).toEqual(newRect);
    expect(onChange).toHaveBeenCalledWith(newRect);
  });
});
