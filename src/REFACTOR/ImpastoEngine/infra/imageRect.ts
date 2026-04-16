/**
 * Image-space geometry helpers shared across selection, color pins, and canvas input.
 *
 * Raster helpers use **half-open** extents (`0 <= x < width`) so clamped pin centers stay
 * on-image without depending on selection or viewport modules.
 */
export type ImagePoint = { readonly x: number; readonly y: number };

/** Axis-aligned rectangle in image pixel space (min/max inclusive). */
export type ImageAxisRect = {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
};

export function normalizeImageRect(a: ImagePoint, b: ImagePoint): ImageAxisRect {
  return {
    minX: Math.min(a.x, b.x),
    maxX: Math.max(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxY: Math.max(a.y, b.y),
  };
}

/** True when both axes moved no more than `epsilon` (inclusive), i.e. a click not a drag. */
export function isBelowDragEpsilon(a: ImagePoint, b: ImagePoint, epsilon: number): boolean {
  return Math.abs(b.x - a.x) <= epsilon && Math.abs(b.y - a.y) <= epsilon;
}

/**
 * Half-open raster bounds in image pixels: valid sample/placement centers satisfy
 * `0 <= x < width` and `0 <= y < height`.
 */
export function isPointInsideImageExtents(
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  return width > 0 && height > 0 && x >= 0 && x < width && y >= 0 && y < height;
}

/** Inset from the open edge so clamped values stay strictly inside `(0,width)×(0,height)` in float64. */
const RASTER_CLAMP_INSET = 1e-9;

/**
 * Clamps a point to the same half-open raster extent as {@link isPointInsideImageExtents}
 * (`0 <= x < width`, `0 <= y < height`) so pin centers stay on-image when dragging.
 */
export function clampImagePointInsideRaster(
  x: number,
  y: number,
  width: number,
  height: number,
): { readonly x: number; readonly y: number } {
  if (!(width > RASTER_CLAMP_INSET) || !(height > RASTER_CLAMP_INSET)) {
    return { x: 0, y: 0 };
  }
  const maxX = width - RASTER_CLAMP_INSET;
  const maxY = height - RASTER_CLAMP_INSET;
  return {
    x: Math.min(Math.max(x, 0), maxX),
    y: Math.min(Math.max(y, 0), maxY),
  };
}
