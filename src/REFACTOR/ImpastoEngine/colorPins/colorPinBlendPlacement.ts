import type { RawImage } from '../../../types';
import { deltaELab, hexToRgb, normalizeHex, rgbToLab } from '../../../utils/colorUtils';
import type { ColorPin } from './ColorPinState';

type ColorPinBlendPlacementOptions = {
  /**
   * LAB ΔE (CIE76 on D50-style `rgbToLab` from `colorUtils`) must be ≤ this value
   * to count as “close enough” to the blended target when picking by distance to centroid.
   */
  readonly maxDeltaE: number;
  /** Pixels with alpha ≤ this are ignored (default 0 = include all). */
  readonly minAlpha?: number;
};

type ColorPinBlendPlacementResult = {
  readonly imageX: number;
  readonly imageY: number;
  readonly radiusPx: number;
  /** True when no pixel met {@link ColorPinBlendPlacementOptions.maxDeltaE}; global best ΔE was used instead. */
  readonly usedDeltaEFallback: boolean;
  /** ΔE at the chosen pixel vs the blended target LAB. */
  readonly deltaE: number;
};

const DEFAULT_MAX_DELTA_E = 15;

type Cand = { x: number; y: number; de: number; d2: number };

function betterConstrained(a: Cand, b: Cand): boolean {
  if (a.d2 !== b.d2) {
    return a.d2 < b.d2;
  }
  if (a.de !== b.de) {
    return a.de < b.de;
  }
  if (a.y !== b.y) {
    return a.y < b.y;
  }
  return a.x < b.x;
}

function betterGlobalDeltaE(a: Cand, b: Cand): boolean {
  if (a.de !== b.de) {
    return a.de < b.de;
  }
  if (a.d2 !== b.d2) {
    return a.d2 < b.d2;
  }
  if (a.y !== b.y) {
    return a.y < b.y;
  }
  return a.x < b.x;
}

/**
 * Mean pin position in filtered image space (fractional).
 */
export function centroidOfColorPins(pins: readonly ColorPin[]): { readonly x: number; readonly y: number } {
  let sx = 0;
  let sy = 0;
  for (const p of pins) {
    sx += p.imageX;
    sy += p.imageY;
  }
  const n = pins.length;
  return { x: sx / n, y: sy / n };
}

/**
 * **Lab-space average** of pin display colors (`#rrggbb`): each pin is converted with {@link rgbToLab}
 * (sRGB → linear → same CIELAB pipeline as raster ΔE), then the arithmetic mean of L*, a*, and b* is taken.
 * This is the blend target for merge / “middle” placement (vector mean in Lab coordinates, not Mixbox / pigment).
 */
export function averageLabFromPinHexColors(pins: readonly ColorPin[]): [number, number, number] {
  let sl = 0;
  let sa = 0;
  let sb = 0;
  for (const p of pins) {
    const [r, g, b] = hexToRgb(normalizeHex(p.color));
    const [l, a, b_] = rgbToLab(r, g, b);
    sl += l;
    sa += a;
    sb += b_;
  }
  const n = pins.length;
  return [sl / n, sa / n, sb / n];
}

function averageRadiusPx(pins: readonly ColorPin[]): number {
  let s = 0;
  for (const p of pins) {
    s += p.radiusPx;
  }
  return Math.max(1, Math.round(s / pins.length));
}

function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/**
 * Among pixels with ΔE ≤ `maxDeltaE`, pick the one closest to `(cx, cy)` (tie: lower ΔE, then y, then x).
 * If none qualify, pick the pixel with smallest ΔE globally (tie: closest to centroid, then y, then x).
 */
export function nearestRasterPixelToCentroidForBlendedLab(
  raster: Pick<RawImage, 'width' | 'height' | 'data'>,
  cx: number,
  cy: number,
  targetLab: [number, number, number],
  options: ColorPinBlendPlacementOptions,
): { readonly x: number; readonly y: number; readonly deltaE: number; readonly usedDeltaEFallback: boolean } {
  const { width, height, data } = raster;
  const maxDeltaE = options.maxDeltaE;
  const minAlpha = options.minAlpha ?? 0;

  let bestConstrained: Cand | null = null;
  let bestGlobal: Cand | null = null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3]! <= minAlpha) {
        continue;
      }
      const lab = rgbToLab(data[i]!, data[i + 1]!, data[i + 2]!);
      const de = deltaELab(lab, targetLab);
      const d2 = distSq(x, y, cx, cy);
      const cand: Cand = { x, y, de, d2 };

      if (!bestGlobal || betterGlobalDeltaE(cand, bestGlobal)) {
        bestGlobal = cand;
      }

      if (de <= maxDeltaE && (!bestConstrained || betterConstrained(cand, bestConstrained))) {
        bestConstrained = cand;
      }
    }
  }

  if (bestGlobal === null) {
    return { x: 0, y: 0, deltaE: 0, usedDeltaEFallback: true };
  }

  if (bestConstrained) {
    return {
      x: bestConstrained.x,
      y: bestConstrained.y,
      deltaE: bestConstrained.de,
      usedDeltaEFallback: false,
    };
  }

  return {
    x: bestGlobal.x,
    y: bestGlobal.y,
    deltaE: bestGlobal.de,
    usedDeltaEFallback: true,
  };
}

/**
 * Resolves blend geometry for several pins: centroid of positions, {@link averageLabFromPinHexColors}
 * as the Lab-space blend target, then nearest raster pixel to that centroid within ΔE (with fallback).
 */
export function computeColorPinBlendPlacement(
  filtered: Pick<RawImage, 'width' | 'height' | 'data'> | null,
  pins: readonly ColorPin[],
  options?: Partial<ColorPinBlendPlacementOptions>,
): ColorPinBlendPlacementResult | null {
  if (!filtered || filtered.width <= 0 || filtered.height <= 0 || pins.length < 2) {
    return null;
  }

  const maxDeltaE = options?.maxDeltaE ?? DEFAULT_MAX_DELTA_E;
  const minAlpha = options?.minAlpha ?? 0;

  const { x: cx, y: cy } = centroidOfColorPins(pins);
  const targetLab = averageLabFromPinHexColors(pins);
  const { x, y, deltaE, usedDeltaEFallback } = nearestRasterPixelToCentroidForBlendedLab(
    filtered,
    cx,
    cy,
    targetLab,
    { maxDeltaE, minAlpha },
  );

  const clampedX = Math.max(0, Math.min(filtered.width - 1, x));
  const clampedY = Math.max(0, Math.min(filtered.height - 1, y));

  return {
    imageX: clampedX,
    imageY: clampedY,
    radiusPx: averageRadiusPx(pins),
    usedDeltaEFallback: usedDeltaEFallback,
    deltaE,
  };
}
