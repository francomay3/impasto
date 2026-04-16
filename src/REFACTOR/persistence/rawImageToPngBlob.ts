import type { RawImage } from '../../types';

/**
 * Encodes an RGBA {@link RawImage} as a PNG {@link Blob} using the Canvas API.
 * Requires a browser (or DOM test environment); Node without `document` throws.
 */
export function rawImageToPngBlob(image: RawImage): Promise<Blob> {
  if (image.width <= 0 || image.height <= 0) {
    return Promise.reject(new Error('RawImage width and height must be positive'));
  }
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return Promise.reject(
      new Error('rawImageToPngBlob requires a browser environment (Canvas API)')
    );
  }

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('CanvasRenderingContext2D is not available'));
  }

  const copy = new Uint8ClampedArray(image.data);
  const imageData = new ImageData(copy, image.width, image.height);
  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob produced no PNG data'));
        }
      },
      'image/png'
    );
  });
}
