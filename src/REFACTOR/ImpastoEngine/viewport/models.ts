/** Shared engine-layer value types (no behavior). */

/**
 * Viewport transform in document space: translation `x`/`y` and zoom `z`.
 */
export type ViewportTransform = {
  x: number;
  y: number;
  z: number;
};
