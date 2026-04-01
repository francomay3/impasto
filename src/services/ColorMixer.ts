import type { Pigment } from '../types';
import { ciede2000, mixLatent } from './colorMixerMetrics';
import { findBestNPigments, type PigmentMix } from './colorMixerOptimizer';

export const PIGMENTS: Pigment[] = [
  { name: 'Titanium White', rgb: 'rgb(252, 255, 240)' },
  { name: 'Ivory Black', rgb: 'rgb(12, 11, 10)' },
  { name: 'Cadmium Yellow', rgb: 'rgb(254, 236, 0)' },
  { name: 'Hansa Yellow', rgb: 'rgb(252, 211, 0)' },
  { name: 'Cadmium Orange', rgb: 'rgb(255, 106, 0)' },
  { name: 'Cadmium Red', rgb: 'rgb(255, 39, 2)' },
  { name: 'Quinacridone Magenta', rgb: 'rgb(128, 2, 46)' },
  { name: 'Medium Magenta', rgb: 'rgb(190, 67, 152)' },
  { name: 'Cobalt Violet', rgb: 'rgb(78, 0, 66)' },
  { name: 'Ultramarine Blue', rgb: 'rgb(25, 0, 89)' },
  { name: 'Cobalt Blue', rgb: 'rgb(0, 33, 133)' },
  { name: 'Phthalo Blue', rgb: 'rgb(13, 27, 68)' },
  { name: 'Phthalo Green', rgb: 'rgb(0, 60, 50)' },
  { name: 'Permanent Green', rgb: 'rgb(7, 109, 22)' },
  { name: 'Sap Green', rgb: 'rgb(107, 148, 4)' },
  { name: 'Burnt Sienna', rgb: 'rgb(123, 72, 0)' },
];

export const DEFAULT_MIN_PAINT_PERCENT = 2;
export const DEFAULT_DELTA_THRESHOLD = 4;

export type MixEntry = { name: string; rgb: string; parts: number };

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function computeBestMix(
  targetHex: string,
  deltaThreshold: number,
  minPaintPercent: number,
  pigments: Pigment[]
): PigmentMix {
  let bestDelta = Infinity;
  let bestMix: PigmentMix = [];

  for (const p of pigments) {
    const d = ciede2000(p.rgb, targetHex);
    if (d < bestDelta) {
      bestDelta = d;
      bestMix = [{ name: p.name, parts: 1 }];
    }
  }
  if (bestDelta < deltaThreshold) return bestMix;

  for (const n of [2, 3, 4]) {
    const { mix, delta } = findBestNPigments(targetHex, n, pigments, minPaintPercent);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestMix = mix;
    }
    if (bestDelta < deltaThreshold) return bestMix;
  }

  return bestMix;
}

export function findMixData(
  targetHex: string,
  minPaintPercent = DEFAULT_MIN_PAINT_PERCENT,
  deltaThreshold = DEFAULT_DELTA_THRESHOLD,
  pigments = PIGMENTS
): MixEntry[] {
  const mix = computeBestMix(targetHex, deltaThreshold, minPaintPercent, pigments);
  const divisor = mix.reduce((acc, p) => gcd(acc, p.parts), mix[0]?.parts ?? 1);
  return mix.map((p) => ({
    name: p.name,
    rgb: pigments.find((pig) => pig.name === p.name)?.rgb ?? 'rgb(0, 0, 0)',
    parts: p.parts / divisor,
  }));
}

export function mixedResultHex(entries: MixEntry[]): string {
  if (entries.length === 1) return entries[0].rgb;
  return mixLatent(
    entries.map((e) => e.rgb),
    entries.map((e) => e.parts)
  );
}

export function findMixRecipe(
  targetHex: string,
  minPaintPercent = DEFAULT_MIN_PAINT_PERCENT,
  deltaThreshold = DEFAULT_DELTA_THRESHOLD,
  pigments = PIGMENTS
): string {
  const data = findMixData(targetHex, minPaintPercent, deltaThreshold, pigments);
  const total = data.reduce((s, e) => s + e.parts, 0);
  return data.map((e) => `${Math.round((e.parts / total) * 100)}% ${e.name}`).join(', ');
}
