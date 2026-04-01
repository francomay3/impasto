import type { Pigment } from '../types';
import { ciede2000, mixLatent } from './colorMixerMetrics';

export type PigmentMix = { name: string; parts: number }[];

function normalizeWeights(v: number[]): number[] {
  const clamped = v.map(x => Math.max(1e-6, x));
  const sum = clamped.reduce((a, b) => a + b, 0);
  return clamped.map(x => x / sum);
}

function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  return arr.flatMap((item, i) =>
    getCombinations(arr.slice(i + 1), k - 1).map(rest => [item, ...rest])
  );
}

function nelderMead(objective: (w: number[]) => number, n: number, maxIter = 200): number[] {
  const [α, γ, ρ, σ] = [1, 2, 0.5, 0.5];
  const eval_ = (v: number[]) => objective(normalizeWeights(v));

  const pts: number[][] = [Array(n).fill(1) as number[]];
  for (let i = 0; i < n; i++) {
    const v = Array(n).fill(1) as number[];
    v[i] += 0.3 * n;
    pts.push(v);
  }
  const vals = pts.map(eval_);

  for (let iter = 0; iter < maxIter; iter++) {
    const ord = [...Array(n + 1).keys()].sort((a, b) => vals[a] - vals[b]);
    const P = ord.map(i => pts[i]);
    const V = ord.map(i => vals[i]);

    if (V[n] - V[0] < 1e-6) break;

    const c = Array(n).fill(0) as number[];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += P[i][j] / n;

    const xr = c.map((ci, j) => ci + α * (ci - P[n][j]));
    const fr = eval_(xr);

    if (fr < V[0]) {
      const xe = c.map((ci, j) => ci + γ * (xr[j] - ci));
      const fe = eval_(xe);
      P[n] = fe < fr ? xe : xr;
      V[n] = Math.min(fe, fr);
    } else if (fr < V[n - 1]) {
      P[n] = xr;
      V[n] = fr;
    } else {
      const xc = c.map((ci, j) => ci + ρ * (P[n][j] - ci));
      const fc = eval_(xc);
      if (fc < V[n]) {
        P[n] = xc;
        V[n] = fc;
      } else {
        for (let i = 1; i <= n; i++) {
          P[i] = P[0].map((x, j) => x + σ * (P[i][j] - x));
          V[i] = eval_(P[i]);
        }
      }
    }

    for (let i = 0; i <= n; i++) { pts[i] = P[i]; vals[i] = V[i]; }
  }

  return normalizeWeights(pts[vals.indexOf(Math.min(...vals))]);
}

export function findBestNPigments(
  targetHex: string,
  n: number,
  pigments: Pigment[],
  minPaintPercent: number
): { mix: PigmentMix; delta: number } {
  let bestDelta = Infinity;
  let bestMix: PigmentMix = [];
  const minWeight = minPaintPercent / 100;

  for (const combo of getCombinations(pigments, n)) {
    const hexes = combo.map(p => p.rgb);
    const rawWeights = nelderMead(w => ciede2000(mixLatent(hexes, w), targetHex), n);

    // Drop pigments below the minimum threshold and re-optimise the surviving set.
    const kept = combo.map((p, i) => ({ p, w: rawWeights[i] })).filter(({ w }) => w >= minWeight);
    if (kept.length === 0) continue;

    const finalCombo = kept.map(({ p }) => p);
    const finalHexes = finalCombo.map(p => p.rgb);
    const finalWeights = kept.length === 1
      ? [1]
      : nelderMead(w => ciede2000(mixLatent(finalHexes, w), targetHex), kept.length);

    const delta = ciede2000(mixLatent(finalHexes, finalWeights), targetHex);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestMix = finalCombo.map((p, i) => ({
        name: p.name,
        parts: Math.max(1, Math.round(finalWeights[i] * 100)),
      }));
    }
  }

  return { mix: bestMix, delta: bestDelta };
}
