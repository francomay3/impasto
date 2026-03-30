const MAX_PIXELS = 2_000_000;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      type,
      quality
    );
  });
}

export function withWebpExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  const base = dot >= 0 ? filename.slice(0, dot) : filename;
  return `${base}.webp`;
}

/**
 * Prepares an image file for use in the editor:
 * - Shrinks to at most 2 megapixels (preserving aspect ratio)
 * - Converts to WebP at 0.85 quality
 * Returns a resized ImageBitmap and a corresponding WebP File.
 */
export async function prepareImage(file: File): Promise<{ bitmap: ImageBitmap; webpFile: File }> {
  const original = await createImageBitmap(file);
  const { width, height } = original;
  const pixels = width * height;

  let tw = width;
  let th = height;
  if (pixels > MAX_PIXELS) {
    const scale = Math.sqrt(MAX_PIXELS / pixels);
    tw = Math.round(width * scale);
    th = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  canvas.getContext('2d')!.drawImage(original, 0, 0, tw, th);
  original.close();

  const blob = await toBlob(canvas, 'image/webp', 0.85);
  const webpFile = new File([blob], withWebpExtension(file.name), { type: 'image/webp' });
  const bitmap = await createImageBitmap(canvas);

  return { bitmap, webpFile };
}
