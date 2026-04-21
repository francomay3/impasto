/**
 * Pure viewport math utilities: zoom and pan calculations.
 * These are stateless functions used by gesture handlers to compute the next transform.
 */

const VIEWPORT_MIN_SCALE = 0.25;
const VIEWPORT_MAX_SCALE = 16;

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
  newScale: number,
): number {
  return cursorInViewport - (cursorInViewport - currentPan) * (newScale / oldScale);
}

/**
 * Calculates the new pan offset after a mouse drag step.
 */
export function panOnDrag(startPan: number, startCursor: number, currentCursor: number): number {
  return startPan + (currentCursor - startCursor);
}

/**
 * Returns a new scale from a continuous wheel delta (normalized pixel units from use-gesture).
 * Uses exp() so perceived change is proportional regardless of current zoom level.
 */
export function applyZoomFromWheelDelta(
  currentScale: number,
  normalizedDeltaY: number,
  sensitivity = 0.001,
  min = VIEWPORT_MIN_SCALE,
  max = VIEWPORT_MAX_SCALE,
): number {
  return Math.max(min, Math.min(max, currentScale * Math.exp(-normalizedDeltaY * sensitivity)));
}

/**
 * Returns a new scale from a pinch gesture's cumulative scale offset (e.g. 2.0 = double).
 * Pair with use-gesture's onPinch offset[0] and the transform captured at gesture start.
 */
export function applyZoomFromPinchOffset(
  startScale: number,
  pinchOffsetScale: number,
  min = VIEWPORT_MIN_SCALE,
  max = VIEWPORT_MAX_SCALE,
): number {
  return Math.max(min, Math.min(max, startScale * pinchOffsetScale));
}
