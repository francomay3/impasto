import { describe, expect, it } from 'vitest';
import {
  averageLabFromPinHexColors,
  centroidOfColorPins,
  computeColorPinBlendPlacement,
  nearestRasterPixelToCentroidForBlendedLab,
} from './colorPinBlendPlacement';
import type { ColorPin } from './ColorPinState';
import { deltaELab, rgbToLab } from '../../utils/colorUtils';
import { sampleCircleAverage } from '../../utils/imageProcessing';

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
    // Solid green interior so radius-1 Euclidean disk matches pure green; red rim worsens ΔE away from centroid.
    const green = [0, 255, 0, 255];
    const red = [255, 0, 0, 255];
    const rowG = [...green, ...green, ...green, ...green, ...green];
    const rowREdge = [...red, ...green, ...green, ...green, ...red];
    const raster = rgbaRaster([...rowREdge, ...rowREdge, ...rowG, ...rowREdge, ...rowREdge], 5, 5);
    const target = rgbToLab(0, 255, 0);
    const r = nearestRasterPixelToCentroidForBlendedLab(raster, 2, 2, target, { maxDeltaE: 5 });
    expect(r.x).toBe(2);
    expect(r.y).toBe(2);
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

  it('3×1 strip: target is neighborhood-averaged Lab at center, not raw pure green', () => {
    const raster = rgbaRaster([0, 0, 0, 255, 0, 255, 0, 255, 0, 0, 0, 255], 3, 1);
    const [ar, ag, ab] = sampleCircleAverage(raster, 1, 0, 1);
    const targetLab = rgbToLab(ar, ag, ab);
    const rawCenterLab = rgbToLab(0, 255, 0);
    expect(deltaELab(rawCenterLab, targetLab)).toBeGreaterThan(1);

    const r = nearestRasterPixelToCentroidForBlendedLab(raster, 1, 0, targetLab, { maxDeltaE: 15 });
    expect(r.x).toBe(1);
    expect(r.y).toBe(0);
    expect(r.usedDeltaEFallback).toBe(false);
    expect(r.deltaE).toBeLessThan(0.01);
  });

  it('scores candidates by neighborhood average (same as pin sampling), not raw center RGB', () => {
    // 7×7: interior A at (2,2) is pure green with black cardinals → radius-1 average is dark green.
    // B at (5,2) has raw center matching that average but white cardinals → neighborhood Lab is far from target.
    // Raw-only scoring would prefer B; placement must follow sampleCircleAverage like the pin color.
    const w = 7;
    const h = 7;
    const data = new Uint8ClampedArray(w * h * 4).fill(0);
    for (let i = 3; i < data.length; i += 4) {
      data[i] = 255;
    }
    const setRgb = (x: number, y: number, r: number, g: number, b: number) => {
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    };
    setRgb(2, 2, 0, 255, 0);
    for (const [nx, ny] of [
      [2, 1],
      [2, 3],
      [1, 2],
      [3, 2],
    ] as const) {
      setRgb(nx, ny, 0, 0, 0);
    }
    setRgb(5, 2, 0, 51, 0);
    for (const [nx, ny] of [
      [4, 2],
      [6, 2],
      [5, 1],
      [5, 3],
    ] as const) {
      setRgb(nx, ny, 255, 255, 255);
    }
    const raster = { width: w, height: h, data };
    const [tr, tg, tb] = sampleCircleAverage(raster, 2, 2, 1);
    const targetLab = rgbToLab(tr, tg, tb);
    const r = nearestRasterPixelToCentroidForBlendedLab(raster, 2, 2, targetLab, { maxDeltaE: 25 });
    expect(r.x).toBe(2);
    expect(r.y).toBe(2);
    const [ar, ag, ab] = sampleCircleAverage(raster, r.x, r.y, 1);
    expect(rgbToLab(ar, ag, ab)[0]).toBeCloseTo(targetLab[0]!, 5);
    expect(rgbToLab(ar, ag, ab)[1]).toBeCloseTo(targetLab[1]!, 5);
    expect(rgbToLab(ar, ag, ab)[2]).toBeCloseTo(targetLab[2]!, 5);
    expect(data[(2 * w + 2) * 4 + 1]).toBe(255);
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
    const green = [0, 255, 0, 255];
    const red = [255, 0, 0, 255];
    const rowG = [...green, ...green, ...green, ...green, ...green];
    const rowREdge = [...red, ...green, ...green, ...green, ...red];
    const img = rgbaRaster([...rowREdge, ...rowREdge, ...rowG, ...rowREdge, ...rowREdge], 5, 5);
    const pins = [
      pin({ id: 'a', imageX: 1, imageY: 2, color: '#00ff00' }),
      pin({ id: 'b', imageX: 3, imageY: 2, color: '#00ff00' }),
    ];
    const r = computeColorPinBlendPlacement(img, pins, { maxDeltaE: 8 });
    expect(r).not.toBeNull();
    expect(r!.imageX).toBe(2);
    expect(r!.imageY).toBe(2);
    expect(r!.radiusPx).toBe(1);
  });

  it('merged pin uses radiusPx 1 even when source pins have different radii', () => {
    const green = [0, 255, 0, 255];
    const red = [255, 0, 0, 255];
    const rowG = [...green, ...green, ...green, ...green, ...green];
    const rowREdge = [...red, ...green, ...green, ...green, ...red];
    const img = rgbaRaster([...rowREdge, ...rowREdge, ...rowG, ...rowREdge, ...rowREdge], 5, 5);
    const pins = [
      pin({ id: 'a', imageX: 1, imageY: 2, color: '#00ff00', radiusPx: 2 }),
      pin({ id: 'b', imageX: 3, imageY: 2, color: '#00ff00', radiusPx: 4 }),
    ];
    const r = computeColorPinBlendPlacement(img, pins, { maxDeltaE: 8 });
    expect(r).not.toBeNull();
    expect(r!.imageX).toBe(2);
    expect(r!.imageY).toBe(2);
    expect(r!.radiusPx).toBe(1);
  });
});
