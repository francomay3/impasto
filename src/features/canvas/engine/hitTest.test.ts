import { describe, it, expect } from 'vitest';
import { findPinAt, findPinsInRect } from './hitTest';
import type { Color } from '../../../types';

const makePin = (id: string, x: number, y: number): Color => ({
  id, hex: '#000000', locked: false, ratio: 1, mixRecipe: '',
  sample: { x, y, radius: 10 },
});

const makeRect = (left = 0, top = 0, width = 100, height = 100) => ({
  left, top, width, height,
});

describe('findPinAt', () => {
  it('returns the id of a pin within hit radius', () => {
    const pins = [makePin('p1', 50, 50)];
    // Pin screen position: left + (50/100)*100 = 50, same for y
    expect(findPinAt(50, 50, pins, makeRect(), 100, 100)).toBe('p1');
  });

  it('returns null when cursor is outside hit radius', () => {
    const pins = [makePin('p1', 50, 50)];
    // 50px away - well outside HIT_R=11
    expect(findPinAt(0, 0, pins, makeRect(), 100, 100)).toBeNull();
  });

  it('returns null when pin has no sample', () => {
    const pin: Color = { id: 'p1', hex: '#fff', locked: false, ratio: 1, mixRecipe: '' };
    expect(findPinAt(50, 50, [pin], makeRect(), 100, 100)).toBeNull();
  });

  it('returns null when pins array is empty', () => {
    expect(findPinAt(50, 50, [], makeRect(), 100, 100)).toBeNull();
  });

  it('returns the first match when multiple pins are within hit radius', () => {
    const pins = [makePin('p1', 50, 50), makePin('p2', 50, 50)];
    expect(findPinAt(50, 50, pins, makeRect(), 100, 100)).toBe('p1');
  });

  it('accounts for canvas offset (non-zero left/top)', () => {
    const pins = [makePin('p1', 50, 50)];
    // Canvas is at client (200, 300), 100x100
    // Pin screen position: 200 + (50/100)*100 = 250, 300 + (50/100)*100 = 350
    expect(findPinAt(250, 350, pins, makeRect(200, 300, 100, 100), 100, 100)).toBe('p1');
  });

  it('accounts for zoom scale (canvas rect larger than natural size)', () => {
    // Canvas rendered at 2x zoom: 200x200 on screen for a 100x100 image
    const pins = [makePin('p1', 50, 50)];
    // Pin screen position: 0 + (50/100)*200 = 100
    expect(findPinAt(100, 100, pins, makeRect(0, 0, 200, 200), 100, 100)).toBe('p1');
    // Cursor at natural position (50,50) should NOT hit (too far from 100,100)
    expect(findPinAt(50, 50, pins, makeRect(0, 0, 200, 200), 100, 100)).toBeNull();
  });
});

describe('findPinsInRect', () => {
  it('returns pins inside the selection rect', () => {
    const pins = [makePin('inside', 50, 50), makePin('outside', 10, 10)];
    const rect = { startX: 40, startY: 40, endX: 80, endY: 80 };
    const result = findPinsInRect(rect, pins, makeRect(), 100, 100);
    expect(result.has('inside')).toBe(true);
    expect(result.has('outside')).toBe(false);
  });

  it('handles reversed start/end coordinates', () => {
    const pins = [makePin('c1', 50, 50)];
    const rect = { startX: 80, startY: 80, endX: 40, endY: 40 };
    expect(findPinsInRect(rect, pins, makeRect(), 100, 100).has('c1')).toBe(true);
  });

  it('returns empty set when no pins match', () => {
    const pins = [makePin('c1', 90, 90)];
    const rect = { startX: 0, startY: 0, endX: 20, endY: 20 };
    expect(findPinsInRect(rect, pins, makeRect(), 100, 100).size).toBe(0);
  });

  it('returns empty set when pins is empty', () => {
    const rect = { startX: 0, startY: 0, endX: 100, endY: 100 };
    expect(findPinsInRect(rect, [], makeRect(), 100, 100).size).toBe(0);
  });

  it('includes pins on the boundary', () => {
    const pins = [makePin('edge', 40, 40)];
    // Client rect for image-space (40,40): (40/100)*100 + 0 = 40
    const rect = { startX: 40, startY: 40, endX: 80, endY: 80 };
    expect(findPinsInRect(rect, pins, makeRect(), 100, 100).has('edge')).toBe(true);
  });

  it('accounts for canvas offset and scale', () => {
    // Canvas at (100, 100), 200x200 (2x zoom), image 100x100
    const pins = [makePin('p1', 50, 50)]; // screen: 100 + (50/100)*200 = 200
    const rect = { startX: 190, startY: 190, endX: 210, endY: 210 };
    expect(findPinsInRect(rect, pins, makeRect(100, 100, 200, 200), 100, 100).has('p1')).toBe(true);
  });

  it('skips pins without a sample', () => {
    const pin: Color = { id: 'p1', hex: '#fff', locked: false, ratio: 1, mixRecipe: '' };
    const rect = { startX: 0, startY: 0, endX: 100, endY: 100 };
    expect(findPinsInRect(rect, [pin], makeRect(), 100, 100).size).toBe(0);
  });
});
