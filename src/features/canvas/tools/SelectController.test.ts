import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SelectController } from './SelectController';
import type { SelectResult } from './SelectController';
import type { Color } from '../../../types';

const makeRect = () => ({ left: 0, top: 0, width: 200, height: 200 });

const makePin = (id: string, x: number, y: number): Color => ({
  id,
  hex: '#000000',
  locked: false,
  ratio: 1,
  mixRecipe: '',
  sample: { x, y, radius: 30 },
});

// Canvas rect is 200x200, image is 200x200 → pin screen coords = pin image coords.
// HIT_R = 11px in hitTest.ts.

describe('SelectController', () => {
  let onSelect: (result: SelectResult) => void;
  let onHover: (pinId: string | null) => void;
  let ctrl: SelectController;
  let pins: Color[];

  beforeEach(() => {
    onSelect = vi.fn() as (result: SelectResult) => void;
    onHover = vi.fn() as (pinId: string | null) => void;
    ctrl = new SelectController(onSelect, onHover);
    pins = [makePin('a', 50, 50), makePin('b', 150, 150)];
  });

  describe('handleClick()', () => {
    it('emits deselect_all when clicking empty space', () => {
      ctrl.handleClick(100, 100, pins, makeRect(), 200, 200, false);
      expect(onSelect).toHaveBeenCalledWith<[SelectResult]>({ type: 'deselect_all' });
    });

    it('emits select with toggle=false when clicking a pin without modifier', () => {
      ctrl.handleClick(50, 50, pins, makeRect(), 200, 200, false);
      expect(onSelect).toHaveBeenCalledWith<[SelectResult]>({ type: 'select', pinId: 'a', toggle: false });
    });

    it('emits select with toggle=true when clicking a pin with modifier key', () => {
      ctrl.handleClick(50, 50, pins, makeRect(), 200, 200, true);
      expect(onSelect).toHaveBeenCalledWith<[SelectResult]>({ type: 'select', pinId: 'a', toggle: true });
    });

    it('selects the correct pin when multiple pins exist', () => {
      ctrl.handleClick(150, 150, pins, makeRect(), 200, 200, false);
      expect(onSelect).toHaveBeenCalledWith<[SelectResult]>({ type: 'select', pinId: 'b', toggle: false });
    });

    it('selects pin within hit radius (HIT_R = 11px)', () => {
      ctrl.handleClick(50 + 10, 50, pins, makeRect(), 200, 200, false);
      expect(onSelect).toHaveBeenCalledWith<[SelectResult]>({ type: 'select', pinId: 'a', toggle: false });
    });

    it('emits deselect_all when click is just outside hit radius', () => {
      ctrl.handleClick(50 + 12, 50, pins, makeRect(), 200, 200, false);
      expect(onSelect).toHaveBeenCalledWith<[SelectResult]>({ type: 'deselect_all' });
    });

    it('ignores pins without a sample', () => {
      const pinNoSample: Color = { id: 'c', hex: '#fff', locked: false, ratio: 1, mixRecipe: '' };
      ctrl.handleClick(0, 0, [pinNoSample], makeRect(), 200, 200, false);
      expect(onSelect).toHaveBeenCalledWith<[SelectResult]>({ type: 'deselect_all' });
    });

    it('scales pin position by canvas/image ratio', () => {
      // Image 400x400, canvas 200x200 → pin at image (100,100) renders at screen (50,50)
      const pin = makePin('x', 100, 100);
      ctrl.handleClick(50, 50, [pin], makeRect(), 400, 400, false);
      expect(onSelect).toHaveBeenCalledWith<[SelectResult]>({ type: 'select', pinId: 'x', toggle: false });
    });
  });

  describe('handleHover()', () => {
    it('calls onHover with pin id when hovering over a pin', () => {
      ctrl.handleHover(50, 50, pins, makeRect(), 200, 200);
      expect(onHover).toHaveBeenCalledWith('a');
    });

    it('does not call onHover when already hovering over empty space', () => {
      // initial state is null, hovering empty space should not trigger callback
      ctrl.handleHover(100, 100, pins, makeRect(), 200, 200);
      expect(onHover).not.toHaveBeenCalled();
    });

    it('does not call onHover when hovered pin has not changed', () => {
      ctrl.handleHover(50, 50, pins, makeRect(), 200, 200);
      ctrl.handleHover(51, 50, pins, makeRect(), 200, 200);
      expect(onHover).toHaveBeenCalledTimes(1);
    });

    it('calls onHover again when hovered pin changes', () => {
      ctrl.handleHover(50, 50, pins, makeRect(), 200, 200);
      ctrl.handleHover(150, 150, pins, makeRect(), 200, 200);
      expect(onHover).toHaveBeenCalledTimes(2);
      expect(onHover).toHaveBeenNthCalledWith(2, 'b');
    });

    it('calls onHover with null when moving from a pin to empty space', () => {
      ctrl.handleHover(50, 50, pins, makeRect(), 200, 200);
      ctrl.handleHover(100, 100, pins, makeRect(), 200, 200);
      expect(onHover).toHaveBeenNthCalledWith(2, null);
    });

    it('works without an onHover callback', () => {
      const ctrlNoHover = new SelectController(onSelect);
      expect(() => ctrlNoHover.handleHover(50, 50, pins, makeRect(), 200, 200)).not.toThrow();
    });
  });

  describe('getHoveredId()', () => {
    it('returns null initially', () => {
      expect(ctrl.getHoveredId()).toBeNull();
    });

    it('returns the currently hovered pin id after a hover call', () => {
      ctrl.handleHover(50, 50, pins, makeRect(), 200, 200);
      expect(ctrl.getHoveredId()).toBe('a');
    });

    it('returns null after moving to empty space', () => {
      ctrl.handleHover(50, 50, pins, makeRect(), 200, 200);
      ctrl.handleHover(100, 100, pins, makeRect(), 200, 200);
      expect(ctrl.getHoveredId()).toBeNull();
    });
  });
});
