import type { Color } from '../types';
import { hexToRgb, rgbToLab, deltaELab } from './colorUtils';

function toLab(hex: string): [number, number, number] {
  return rgbToLab(...hexToRgb(hex));
}

/**
 * Order colors using a greedy nearest-neighbour chain in LAB space,
 * starting from the darkest color (lowest L*).
 * Each successive color is the perceptually closest unvisited one,
 * producing a smooth gradient-like sequence.
 */
export function sortByColorSimilarity(colors: Color[]): Color[] {
  if (colors.length <= 1) return [...colors];

  const labs = colors.map((c) => toLab(c.hex));

  // Anchor at the darkest color
  let current = 0;
  for (let i = 1; i < labs.length; i++) {
    if (labs[i][0] < labs[current][0]) current = i;
  }

  const visited = new Array(colors.length).fill(false);
  const result: Color[] = [];

  for (let step = 0; step < colors.length; step++) {
    visited[current] = true;
    result.push(colors[current]);

    let next = -1;
    let minDE = Infinity;
    for (let i = 0; i < colors.length; i++) {
      if (visited[i]) continue;
      const de = deltaELab(labs[current], labs[i]);
      if (de < minDE) { minDE = de; next = i; }
    }
    current = next;
  }

  return result;
}
