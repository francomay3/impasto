import chroma from 'chroma-js';
import mixbox from '../utils/mixbox';
import type { Pigment } from '../types';

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

export const DEFAULT_MIX_GRANULARITY = 12;
export const DEFAULT_DELTA_THRESHOLD = 6;

export type MixEntry = { name: string; hex: string; parts: number };

type PigmentMix = { name: string; parts: number }[];

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function labDelta(hex1: string, hex2: string): number {
  const [l1, a1, b1] = chroma(hex1).lab();
  const [l2, a2, b2] = chroma(hex2).lab();
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

function mixLatent(hexes: string[], weights: number[]): string {
  const total = weights.reduce((a, b) => a + b, 0);
  const latentMix = new Array<number>(mixbox.LATENT_SIZE).fill(0);
  hexes.forEach((h, i) => {
    const w = weights[i] / total;
    const [r, g, b] = chroma(h).rgb();
    const latent = mixbox.rgbToLatent(r, g, b);
    for (let j = 0; j < latentMix.length; j++) {
      latentMix[j] += w * latent[j];
    }
  });
  const [r, g, b] = mixbox.latentToRgb(latentMix);
  return chroma(r, g, b).hex();
}

function computeBestMix(
  targetHex: string,
  granularity: number,
  deltaThreshold: number,
  pigments: Pigment[]
): PigmentMix {
  let bestDelta = Infinity;
  let bestMix: PigmentMix = [];

  // Pass 1: single pigment
  for (const p of pigments) {
    const d = labDelta(p.hex, targetHex);
    if (d < bestDelta) {
      bestDelta = d;
      bestMix = [{ name: p.name, parts: 1 }];
    }
  }
  if (bestDelta < deltaThreshold) return bestMix;

  // Pass 2: pairs
  for (let i = 0; i < pigments.length; i++) {
    for (let j = i + 1; j < pigments.length; j++) {
      for (let a = 1; a < granularity; a++) {
        const mixed = mixLatent([pigments[i].hex, pigments[j].hex], [a, granularity - a]);
        const d = labDelta(mixed, targetHex);
        if (d < bestDelta) {
          bestDelta = d;
          bestMix = [
            { name: pigments[i].name, parts: a },
            { name: pigments[j].name, parts: granularity - a },
          ];
        }
      }
    }
  }
  if (bestDelta < deltaThreshold) return bestMix;

  // Pass 3: triplets
  for (let i = 0; i < pigments.length; i++) {
    for (let j = i + 1; j < pigments.length; j++) {
      for (let k = j + 1; k < pigments.length; k++) {
        for (let a = 1; a <= granularity - 2; a++) {
          for (let b = 1; b <= granularity - a - 1; b++) {
            const c = granularity - a - b;
            const mixed = mixLatent([pigments[i].hex, pigments[j].hex, pigments[k].hex], [a, b, c]);
            const d = labDelta(mixed, targetHex);
            if (d < bestDelta) {
              bestDelta = d;
              bestMix = [
                { name: pigments[i].name, parts: a },
                { name: pigments[j].name, parts: b },
                { name: pigments[k].name, parts: c },
              ];
            }
          }
        }
      }
    }
  }

  return bestMix;
}

export function findMixData(
  targetHex: string,
  granularity = DEFAULT_MIX_GRANULARITY,
  deltaThreshold = DEFAULT_DELTA_THRESHOLD,
  pigments = PIGMENTS
): MixEntry[] {
  const mix = computeBestMix(targetHex, granularity, deltaThreshold, pigments);
  const divisor = mix.reduce((acc, p) => gcd(acc, p.parts), mix[0]?.parts ?? 1);
  return mix.map((p) => ({
    name: p.name,
    hex: pigments.find((pig) => pig.name === p.name)?.hex ?? '#000000',
    parts: p.parts / divisor,
  }));
}

export function findMixRecipe(
  targetHex: string,
  granularity = DEFAULT_MIX_GRANULARITY,
  deltaThreshold = DEFAULT_DELTA_THRESHOLD,
  pigments = PIGMENTS
): string {
  const data = findMixData(targetHex, granularity, deltaThreshold, pigments);
  const total = data.reduce((s, e) => s + e.parts, 0);
  return data.map((e) => `${Math.round((e.parts / total) * 100)}% ${e.name}`).join(', ');
}
