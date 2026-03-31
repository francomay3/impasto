import type { Pigment } from '../types';
import { ciede2000, mixLatent } from './colorMixerMetrics';
import { findBestNPigments, type PigmentMix } from './colorMixerOptimizer';

export const PIGMENTS: Pigment[] = [
  { name: 'Titanium White', hex: '#fcfff0' },
  { name: 'Ivory Black', hex: '#0c0b0a' },
  { name: 'Cadmium Yellow', hex: '#feec00' },
  { name: 'Hansa Yellow', hex: '#fcd300' },
  { name: 'Cadmium Orange', hex: '#ff6900' },
  { name: 'Cadmium Red', hex: '#ff2702' },
  { name: 'Quinacridone Magenta', hex: '#80022e' },
  { name: 'Cobalt Violet', hex: '#4e0042' },
  { name: 'Ultramarine Blue', hex: '#190059' },
  { name: 'Cobalt Blue', hex: '#002185' },
  { name: 'Phthalo Blue', hex: '#0d1b44' },
  { name: 'Phthalo Green', hex: '#003c32' },
  { name: 'Permanent Green', hex: '#076d16' },
  { name: 'Sap Green', hex: '#6b9404' },
  { name: 'Burnt Sienna', hex: '#7b4800' },
];

export const DEFAULT_MIN_PAINT_PERCENT = 2;
export const DEFAULT_DELTA_THRESHOLD = 4;

export type MixEntry = { name: string; hex: string; parts: number };

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
    const d = ciede2000(p.hex, targetHex);
    if (d < bestDelta) { bestDelta = d; bestMix = [{ name: p.name, parts: 1 }]; }
  }
  if (bestDelta < deltaThreshold) return bestMix;

  for (const n of [2, 3, 4]) {
    const { mix, delta } = findBestNPigments(targetHex, n, pigments, minPaintPercent);
    if (delta < bestDelta) { bestDelta = delta; bestMix = mix; }
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
  return mix.map(p => ({
    name: p.name,
    hex: pigments.find(pig => pig.name === p.name)?.hex ?? '#000000',
    parts: p.parts / divisor,
  }));
}

export function mixedResultHex(entries: MixEntry[]): string {
  if (entries.length === 1) return entries[0].hex;
  return mixLatent(entries.map(e => e.hex), entries.map(e => e.parts));
}

export function findMixRecipe(
  targetHex: string,
  minPaintPercent = DEFAULT_MIN_PAINT_PERCENT,
  deltaThreshold = DEFAULT_DELTA_THRESHOLD,
  pigments = PIGMENTS
): string {
  const data = findMixData(targetHex, minPaintPercent, deltaThreshold, pigments);
  const total = data.reduce((s, e) => s + e.parts, 0);
  return data.map(e => `${Math.round((e.parts / total) * 100)}% ${e.name}`).join(', ');
}
