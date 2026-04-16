import { describe, expect, it } from 'vitest';
import {
  averageLabFromPinHexColors,
  centroidOfColorPins,
  computeColorPinBlendPlacement,
  nearestRasterPixelToCentroidForBlendedLab,
} from './colorPinBlendPlacement';
import type { ColorPin } from './ColorPinState';
import { rgbToLab } from '../../../utils/colorUtils';

function pin(p: Partial<ColorPin> & Pick<ColorPin, 'id' | 'imageX' | 'imageY' | 'color'>): ColorPin {
  return {
    radiusPx: 1,
    ...p,
  };
}

function rgbaRaster(pixels: number[], width: number, height: number) {
  return {
    width,
    height,
    data: new Uint8ClampedArray(pixels),
  };
}

describe('centroidOfColorPins', () => {
  it('averages positions', () => {
    const pins = [
      pin({ id: 'a', imageX: 0, imageY: 0, color: '#000000' }),
      pin({ id: 'b', imageX: 10, imageY: 20, color: '#ffffff' }),
    ];
    expect(centroidOfColorPins(pins)).toEqual({ x: 5, y: 10 });
  });
});

describe('averageLabFromPinHexColors', () => {
  it('averages L*, a*, b* in Lab space (mean of per-pin rgbToLab)', () => {
    const pins = [pin({ id: 'a', imageX: 0, imageY: 0, color: '#ff0000' }), pin({ id: 'b', imageX: 1, imageY: 0, color: '#00ff00' })];
    const lab = averageLabFromPinHexColors(pins);
    const mid = [
      (rgbToLab(255, 0, 0)[0]! + rgbToLab(0, 255, 0)[0]!) / 2,
      (rgbToLab(255, 0, 0)[1]! + rgbToLab(0, 255, 0)[1]!) / 2,
      (rgbToLab(255, 0, 0)[2]! + rgbToLab(0, 255, 0)[2]!) / 2,
    ] as [number, number, number];
    expect(lab[0]).toBeCloseTo(mid[0]!, 5);
    expect(lab[1]).toBeCloseTo(mid[1]!, 5);
    expect(lab[2]).toBeCloseTo(mid[2]!, 5);
  });
});

describe('nearestRasterPixelToCentroidForBlendedLab', () => {
  it('picks closest-to-centroid pixel among those within maxDeltaE', () => {
    // 3x1: red (0), green (1), red (2). Centroid x=1, target green → constrained includes center pixel.
    const raster = rgbaRaster([255, 0, 0, 255, 0, 255, 0, 255, 255, 0, 0, 255], 3, 1);
    const target = rgbToLab(0, 255, 0);
    const r = nearestRasterPixelToCentroidForBlendedLab(raster, 1, 0, target, { maxDeltaE: 5 });
    expect(r.x).toBe(1);
    expect(r.y).toBe(0);
    expect(r.usedDeltaEFallback).toBe(false);
  });

  it('uses fallback when nothing is within maxDeltaE', () => {
    const raster = rgbaRaster([255, 0, 0, 255], 1, 1);
    const target = rgbToLab(0, 255, 0);
    const r = nearestRasterPixelToCentroidForBlendedLab(raster, 0, 0, target, { maxDeltaE: 5 });
    expect(r.usedDeltaEFallback).toBe(true);
    expect(r.x).toBe(0);
    expect(r.y).toBe(0);
  });
});

describe('computeColorPinBlendPlacement', () => {
  it('returns null for fewer than two pins', () => {
    expect(computeColorPinBlendPlacement(rgbaRaster([0, 0, 0, 255], 1, 1), [pin({ id: 'a', imageX: 0, imageY: 0, color: '#000000' })])).toBeNull();
  });

  it('returns null when raster is null', () => {
    expect(
      computeColorPinBlendPlacement(null, [
        pin({ id: 'a', imageX: 0, imageY: 0, color: '#000000' }),
        pin({ id: 'b', imageX: 1, imageY: 0, color: '#ffffff' }),
      ]),
    ).toBeNull();
  });

  it('places at centroid pixel when it matches the averaged pin colors', () => {
    const img = rgbaRaster([255, 0, 0, 255, 0, 255, 0, 255, 255, 0, 0, 255], 3, 1);
    const pins = [
      pin({ id: 'a', imageX: 0, imageY: 0, color: '#00ff00' }),
      pin({ id: 'b', imageX: 2, imageY: 0, color: '#00ff00' }),
    ];
    const r = computeColorPinBlendPlacement(img, pins, { maxDeltaE: 8 });
    expect(r).not.toBeNull();
    expect(r!.imageX).toBe(1);
    expect(r!.imageY).toBe(0);
    expect(r!.radiusPx).toBe(1);
  });
});
