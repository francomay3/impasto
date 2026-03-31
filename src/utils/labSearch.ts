import { rgbToLab, deltaELab } from './colorUtils';

export interface LabSearchResult {
  x: number;
  y: number;
  deltaE: number;
}

/**
 * Scan the ImageData to find the pixel whose color is closest (in LAB ΔE) to targetLab.
 * `step` controls the stride — larger values are faster but less precise.
 * After a coarse pass, we refine around the best candidate at stride 1.
 */
export function findBestMatchPosition(
  imageData: ImageData,
  targetLab: [number, number, number],
  step = 4
): LabSearchResult {
  const { data, width, height } = imageData;
  let bestX = 0, bestY = 0, bestDE = Infinity;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const de = deltaELab(rgbToLab(data[i], data[i + 1], data[i + 2]), targetLab);
      if (de < bestDE) { bestDE = de; bestX = x; bestY = y; }
    }
  }

  // Refine at stride 1 in a neighbourhood around the coarse winner
  const x0 = Math.max(0, bestX - step), x1 = Math.min(width - 1, bestX + step);
  const y0 = Math.max(0, bestY - step), y1 = Math.min(height - 1, bestY + step);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * width + x) * 4;
      const de = deltaELab(rgbToLab(data[i], data[i + 1], data[i + 2]), targetLab);
      if (de < bestDE) { bestDE = de; bestX = x; bestY = y; }
    }
  }

  return { x: bestX, y: bestY, deltaE: bestDE };
}
