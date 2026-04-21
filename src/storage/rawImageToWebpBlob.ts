import type { RawImage } from '../types';
import { cappedDimensions } from '../utils/imageDimensions';

const WEBP_QUALITY = 0.85;

/**
 * Encodes a {@link RawImage} as a WebP {@link Blob}, downscaling to at most 2 MP first.
 * Mirrors the quality/size constraints applied at file-ingest time (see imageResize.ts).
 */
export function rawImageToWebpBlob(image: RawImage): Promise<Blob> {
  if (image.width <= 0 || image.height <= 0) {
    return Promise.reject(new Error('RawImage width and height must be positive'));
  }
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return Promise.reject(new Error('rawImageToWebpBlob requires a browser environment'));
  }

  const { width: targetW, height: targetH } = cappedDimensions(image.width, image.height);

  // Paint raw RGBA pixels onto a source canvas, then draw (and downscale if needed) onto output.
  const src = document.createElement('canvas');
  src.width = image.width;
  src.height = image.height;
  const srcCtx = src.getContext('2d');
  if (!srcCtx) return Promise.reject(new Error('CanvasRenderingContext2D unavailable'));
  srcCtx.putImageData(
    new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
    0,
    0,
  );

  const out = document.createElement('canvas');
  out.width = targetW;
  out.height = targetH;
  const outCtx = out.getContext('2d');
  if (!outCtx) return Promise.reject(new Error('CanvasRenderingContext2D unavailable'));
  outCtx.drawImage(src, 0, 0, targetW, targetH);

  return new Promise((resolve, reject) => {
    out.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob produced no WebP data'))),
      'image/webp',
      WEBP_QUALITY,
    );
  });
}
