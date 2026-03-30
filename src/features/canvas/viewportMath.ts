export const VIEWPORT_MIN_SCALE = 0.25;
export const VIEWPORT_MAX_SCALE = 16;
export const VIEWPORT_ZOOM_FACTOR = 1.1;

/**
 * Returns the new scale after applying a zoom step, clamped to [min, max].
 * zoomIn = true means scroll-up / pinch-out; false means scroll-down / pinch-in.
 */
export function applyZoomStep(
  currentScale: number,
  zoomIn: boolean,
  min = VIEWPORT_MIN_SCALE,
  max = VIEWPORT_MAX_SCALE,
  factor = VIEWPORT_ZOOM_FACTOR
): number {
  const raw = zoomIn ? currentScale * factor : currentScale / factor;
  return Math.max(min, Math.min(max, raw));
}

/**
 * Calculates the new pan offset so that the point under the cursor stays
 * fixed in screen space after a zoom.
 *
 * Derivation: the canvas point under the cursor satisfies
 *   cursor = panX + canvasPoint * scale
 *   canvasPoint = (cursor - panX) / scale   (invariant across zoom)
 * For the cursor to stay fixed:
 *   newPanX = cursor - canvasPoint * newScale
 *           = cursor - (cursor - panX) / scale * newScale
 *           = cursor - (cursor - panX) * (newScale / scale)
 */
export function panOnZoom(
  cursorInViewport: number,
  currentPan: number,
  oldScale: number,
  newScale: number
): number {
  return cursorInViewport - (cursorInViewport - currentPan) * (newScale / oldScale);
}

/**
 * Calculates the new pan offset after a mouse drag step.
 */
export function panOnDrag(startPan: number, startCursor: number, currentCursor: number): number {
  return startPan + (currentCursor - startCursor);
}
