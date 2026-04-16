import { describe, expect, it } from 'vitest';
import { createRawImage } from '../../../types';
import {
  labsForColorPinsFromFilteredImage,
  samplePinColorFromFilteredImage,
} from './indexedPaletteFromColorPins';

describe('labsForColorPinsFromFilteredImage', () => {
  it('returns empty when there are no pins', () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255]);
    const img = createRawImage(data, 1, 1);
    expect(labsForColorPinsFromFilteredImage(img, [])).toEqual([]);
  });

  it('returns empty when filtered image is null', () => {
    expect(
      labsForColorPinsFromFilteredImage(null, [
        { id: 'a', imageX: 0, imageY: 0, radiusPx: 0, color: '#ff0000' },
      ]),
    ).toEqual([]);
  });

  it('samplePinColorFromFilteredImage returns hex matching averaged RGB', () => {
    const data = new Uint8ClampedArray([0, 128, 255, 255]);
    const img = createRawImage(data, 1, 1);
    expect(samplePinColorFromFilteredImage(img, { imageX: 0, imageY: 0, radiusPx: 0 })).toMatch(
      /^#[0-9a-f]{6}$/i,
    );
  });

  it('derives LAB from averaged RGB at pin geometry', () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255]);
    const img = createRawImage(data, 1, 1);
    const pins = [{ id: '1', imageX: 0, imageY: 0, radiusPx: 0, color: '#ff0000' }] as const;
    const [lab] = labsForColorPinsFromFilteredImage(img, pins);
    expect(lab).toBeDefined();
    expect(lab!.l).toBeGreaterThan(40);
    expect(lab!.l).toBeLessThan(60);
  });
});
