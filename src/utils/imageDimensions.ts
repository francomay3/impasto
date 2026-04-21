export const MAX_IMAGE_PIXELS = 2_000_000;

/** Returns the largest dimensions that fit within `maxPixels`, preserving aspect ratio. */
export function cappedDimensions(
  width: number,
  height: number,
  maxPixels = MAX_IMAGE_PIXELS,
): { width: number; height: number } {
  if (width * height <= maxPixels) return { width, height };
  const scale = Math.sqrt(maxPixels / (width * height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
