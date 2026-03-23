import chroma from 'chroma-js';
import type { Pigment } from '../types';

export const PIGMENTS: Pigment[] = [
  { name: 'Titanium White', hex: '#FFFFFF' },
  { name: 'Ivory Black', hex: '#231F20' },
  { name: 'Cadmium Yellow', hex: '#FFF600' },
  { name: 'Yellow Ochre', hex: '#CB9D06' },
  { name: 'Cadmium Red', hex: '#E30022' },
  { name: 'Alizarin Crimson', hex: '#841B2D' },
  { name: 'Ultramarine Blue', hex: '#4169E1' },
  { name: 'Phthalo Blue', hex: '#000F89' },
  { name: 'Viridian Green', hex: '#007F5C' },
  { name: 'Raw Umber', hex: '#826644' },
  { name: 'Burnt Sienna', hex: '#8A3324' },
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

function mixSubtractive(hexes: string[], weights: number[]): string {
  // Approximate subtractive mixing via CMYK in linear light
  let c = 0, m = 0, y = 0;
  const total = weights.reduce((a, b) => a + b, 0);
  hexes.forEach((h, i) => {
    const w = weights[i] / total;
    const [rc, gc, bc] = chroma(h).rgb();
    c += (1 - rc / 255) * w;
    m += (1 - gc / 255) * w;
    y += (1 - bc / 255) * w;
  });
  const r = Math.round((1 - c) * 255);
  const g = Math.round((1 - m) * 255);
  const b = Math.round((1 - y) * 255);
  return chroma(r, g, b).hex();
}

function computeBestMix(
  targetHex: string,
  granularity: number,
  deltaThreshold: number,
  pigments: Pigment[],
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
        const mixed = mixSubtractive(
          [pigments[i].hex, pigments[j].hex],
          [a, granularity - a]
        );
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
            const mixed = mixSubtractive(
              [pigments[i].hex, pigments[j].hex, pigments[k].hex],
              [a, b, c]
            );
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
  pigments = PIGMENTS,
): MixEntry[] {
  const mix = computeBestMix(targetHex, granularity, deltaThreshold, pigments);
  const divisor = mix.reduce((acc, p) => gcd(acc, p.parts), mix[0]?.parts ?? 1);
  return mix.map(p => ({
    name: p.name,
    hex: pigments.find(pig => pig.name === p.name)?.hex ?? '#000000',
    parts: p.parts / divisor,
  }));
}

export function findMixRecipe(
  targetHex: string,
  granularity = DEFAULT_MIX_GRANULARITY,
  deltaThreshold = DEFAULT_DELTA_THRESHOLD,
  pigments = PIGMENTS,
): string {
  return findMixData(targetHex, granularity, deltaThreshold, pigments)
    .map(e => `${e.parts} part${e.parts !== 1 ? 's' : ''} ${e.name}`)
    .join(', ');
}
