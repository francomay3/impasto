import { createRawImage, type RawImage } from '../types/index';
import { prepareImage } from './imageResize';

/**
 * Decodes any browser-supported image file (including HEIC via heic2any) into a {@link RawImage}.
 * Delegates to {@link prepareImage} which handles HEIC→JPEG conversion and the 2 MP resize cap.
 */
export async function loadRawImageFromFile(file: File): Promise<RawImage> {
  const { bitmap } = await prepareImage(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return createRawImage(data, width, height);
}
