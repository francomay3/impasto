import type { ViewportTransform } from '../../../viewport/models';

/**
 * Maps a client-space point to backing-store pixels for a canvas sized to its CSS layout × DPR.
 */
export function clientToBackingStorePixel(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

/**
 * Converts backing-store pixels to **image bitmap** coordinates using the live viewport transform and DPR.
 */
export function backingStorePixelToImagePixel(
  p: { x: number; y: number },
  transform: ViewportTransform,
  displayDpr: number,
): { x: number; y: number } {
  const dpr = displayDpr;
  const t = transform;
  return {
    x: (p.x - dpr * t.x) / (dpr * t.z),
    y: (p.y - dpr * t.y) / (dpr * t.z),
  };
}

/**
 * DPR implied by the canvas backing store vs its CSS layout (matches {@link ViewportCanvasBase} sizing).
 */
function displayDprFromCanvas(canvas: HTMLCanvasElement): number {
  const cw = canvas.clientWidth;
  if (cw <= 0 || canvas.width <= 0) {
    return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  }
  return canvas.width / cw;
}

/**
 * Image bitmap coordinates → backing-store pixels (inverse of {@link backingStorePixelToImagePixel}).
 */
export function imagePixelToBackingStorePixel(
  image: { x: number; y: number },
  transform: ViewportTransform,
  displayDpr: number,
): { x: number; y: number } {
  const dpr = displayDpr;
  const t = transform;
  return {
    x: dpr * t.x + dpr * t.z * image.x,
    y: dpr * t.y + dpr * t.z * image.y,
  };
}

/**
 * Image bitmap coordinates → CSS pixel position relative to the canvas element’s content box
 * (same origin as {@link clientToBackingStorePixel} / {@link getBoundingClientRect} for the canvas).
 *
 * Pin chrome should use **fixed CSS size** and only move using these coordinates so zoom does not blur widgets.
 */
/** Client viewport coordinates → image bitmap space (same mapping as the viewport canvas pointer bridge). */
export function clientPointToImagePixel(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  transform: ViewportTransform,
): { x: number; y: number } {
  const p = clientToBackingStorePixel(canvas, clientX, clientY);
  return backingStorePixelToImagePixel(p, transform, displayDprFromCanvas(canvas));
}

export function imagePixelToCanvasCssPixel(
  image: { x: number; y: number },
  transform: ViewportTransform,
  canvas: HTMLCanvasElement,
): { x: number; y: number } {
  const dpr = displayDprFromCanvas(canvas);
  const p = imagePixelToBackingStorePixel(image, transform, dpr);
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  if (cw <= 0 || ch <= 0 || canvas.width <= 0 || canvas.height <= 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: (p.x / canvas.width) * cw,
    y: (p.y / canvas.height) * ch,
  };
}
