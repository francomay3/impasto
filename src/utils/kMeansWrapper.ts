import { kmeans } from 'ml-kmeans';
import type { Color } from '../types';
import { rgbToHex, hexToRgb } from './colorUtils';

function samplePixels(imageData: ImageData, maxSamples = 8000): number[][] {
  const { data, width, height } = imageData;
  const total = width * height;
  const step = Math.max(1, Math.floor(total / maxSamples));
  const samples: number[][] = [];
  for (let i = 0; i < total; i += step) {
    const idx = i * 4;
    samples.push([data[idx], data[idx + 1], data[idx + 2]]);
  }
  return samples;
}

export function quantizeImage(
  imageData: ImageData,
  k: number,
  lockedColors: Color[]
): Color[] {
  const samples = samplePixels(imageData);
  if (samples.length < k) return [];

  const result = kmeans(samples, k, {});
  const centroids: number[][] = result.centroids as number[][];

  const lockedRgbs = lockedColors.map(c => hexToRgb(c.hex));
  const usedCentroidIdx = new Set<number>();

  const lockedMapped = lockedColors.map((lc, li) => {
    let best = 0;
    let bestDist = Infinity;
    centroids.forEach((c: number[], ci: number) => {
      if (usedCentroidIdx.has(ci)) return;
      const d = Math.hypot(c[0] - lockedRgbs[li][0], c[1] - lockedRgbs[li][1], c[2] - lockedRgbs[li][2]);
      if (d < bestDist) { bestDist = d; best = ci; }
    });
    usedCentroidIdx.add(best);
    return { centroidIdx: best, color: lc };
  });

  const counts = new Array(k).fill(0);
  (result.clusters as number[]).forEach((ci: number) => counts[ci]++);
  const total = result.clusters.length;

  const colors: Color[] = centroids.map((c: number[], ci: number) => {
    const locked = lockedMapped.find(lm => lm.centroidIdx === ci);
    if (locked) {
      return { ...locked.color, ratio: Math.round((counts[ci] / total) * 100) };
    }
    return {
      id: crypto.randomUUID(),
      hex: rgbToHex(c[0], c[1], c[2]),
      locked: false,
      ratio: Math.round((counts[ci] / total) * 100),
      mixRecipe: '',
    };
  });

  return colors;
}

export function remapToIndexed(imageData: ImageData, palette: Color[]): ImageData {
  const { data, width, height } = imageData;
  const out = new Uint8ClampedArray(data.length);
  const rgbs = palette.map(c => hexToRgb(c.hex));

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    let best = 0, bestDist = Infinity;
    rgbs.forEach(([pr, pg, pb]: [number, number, number], idx: number) => {
      const d = Math.hypot(r - pr, g - pg, b - pb);
      if (d < bestDist) { bestDist = d; best = idx; }
    });
    out[i] = rgbs[best][0]; out[i + 1] = rgbs[best][1]; out[i + 2] = rgbs[best][2];
    out[i + 3] = data[i + 3];
  }
  return new ImageData(out, width, height);
}
