import { createRawImage, type RawImage } from '../../types';

/**
 * Fetches a persisted image URL and decodes it into a {@link RawImage}.
 * Uses OffscreenCanvas for pixel extraction — runs in any browser context that supports it.
 */
export async function loadRawImageFromUrl(url: string): Promise<RawImage> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[persistence] Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return createRawImage(data, width, height);
}
