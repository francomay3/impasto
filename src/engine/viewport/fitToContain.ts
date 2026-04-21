import type { ViewportTransform } from './models';

/**
 * Computes a viewport transform that centers the image inside the viewport
 * at the largest uniform scale that fits (object-fit: contain semantics).
 */
export function fitToContain(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): ViewportTransform {
  const z = Math.min(viewportWidth / imageWidth, viewportHeight / imageHeight);
  return {
    x: (viewportWidth - imageWidth * z) / 2,
    y: (viewportHeight - imageHeight * z) / 2,
    z,
  };
}
