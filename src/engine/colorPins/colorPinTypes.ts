/**
 * Palette pins in filtered image space.
 *
 * {@link ColorPin.color} is a **read-only** UX snapshot (`#rrggbb`): averaged sRGB under the pin footprint on the
 * filtered image. The engine sets it at insert and again whenever the pin is repositioned; LAB for indexing is
 * recomputed separately from geometry + filtered pixels.
 */
export type ColorPin = {
  readonly id: string;
  readonly imageX: number;
  readonly imageY: number;
  readonly radiusPx: number;
  /** Read-only display hex from the engine (insert or reposition); callers never set this directly. */
  readonly color: string;
  readonly label?: string;
  readonly groupId?: string;
};

/** Geometry for a new pin. {@link ColorPin.color} is never part of this payload — the engine samples it at insert. */
export type ColorPinAddPayload = {
  imageX: number;
  imageY: number;
  radiusPx: number;
  label?: string;
  groupId?: string;
};
