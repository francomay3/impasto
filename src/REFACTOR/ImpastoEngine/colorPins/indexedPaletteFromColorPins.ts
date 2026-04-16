import chroma from 'chroma-js';
import type { RawImage } from '../../../types';
import { sampleCircleAverage } from '../../../utils/imageProcessing';
import type { IndexedPaletteLab } from '../pipeline/indexedPassTypes';
import type { ColorPin } from './ColorPinState';

function averageRgbFromFilteredAt(
  filtered: RawImage,
  imageX: number,
  imageY: number,
  radiusPx: number,
): [number, number, number] {
  const raster = {
    width: filtered.width,
    height: filtered.height,
    data: new Uint8ClampedArray(filtered.data),
  };
  const [r, g, b] = sampleCircleAverage(raster, imageX, imageY, radiusPx);
  return [r, g, b];
}

function clampRgbTuple(r: number, g: number, b: number): [number, number, number] {
  return [
    Math.max(0, Math.min(255, Math.round(r))),
    Math.max(0, Math.min(255, Math.round(g))),
    Math.max(0, Math.min(255, Math.round(b))),
  ];
}

/**
 * Averaged sRGB under the pin footprint on the filtered bitmap (`#rrggbb`), same rule as indexing LAB.
 * Intended for one-time assignment to {@link ColorPin.color} at insert only; that field is read-only on stored pins.
 */
export function samplePinColorFromFilteredImage(
  filtered: RawImage | null,
  geometry: { imageX: number; imageY: number; radiusPx: number },
): string | null {
  if (!filtered || filtered.width === 0 || filtered.height === 0) {
    return null;
  }
  const [r, g, b] = averageRgbFromFilteredAt(
    filtered,
    geometry.imageX,
    geometry.imageY,
    geometry.radiusPx,
  );
  const [rc, gc, bc] = clampRgbTuple(r, g, b);
  return chroma(rc, gc, bc, 'rgb').hex();
}

/**
 * Derives LAB entries for `img-index` from pins and the current filtered bitmap.
 */
export function labsForColorPinsFromFilteredImage(
  filtered: RawImage | null,
  pins: readonly ColorPin[],
): IndexedPaletteLab[] {
  if (!filtered || filtered.width === 0 || filtered.height === 0 || pins.length === 0) {
    return [];
  }

  const out: IndexedPaletteLab[] = [];
  for (const pin of pins) {
    const [r, g, b] = averageRgbFromFilteredAt(
      filtered,
      pin.imageX,
      pin.imageY,
      pin.radiusPx,
    );
    const [rc, gc, bc] = clampRgbTuple(r, g, b);
    const [l, a, bLab] = chroma(rc, gc, bc, 'rgb').lab();
    out.push({ l, a, b: bLab });
  }
  return out;
}
