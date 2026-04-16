/**
 * Immutable snapshots of the color-pin list for undo/redo and drag sessions.
 *
 * **Invariants:** `cloneColorPinSnapshot` returns a shallow-frozen copy of each pin’s fields
 * (id, image position, radius, color) so history stacks and drag snapshots do not alias live
 * `ColorPinState` objects. `colorPinsEqual` compares pins in array order with strict field equality
 * — the pin list is treated as ordered for history purposes, matching prior engine behavior.
 *
 * **Coupling:** depends only on the `ColorPin` shape from `ColorPinState`; no engine or selection imports.
 */
import type { ColorPin } from '../colorPins/ColorPinState';

export function cloneColorPinSnapshot(pins: readonly ColorPin[]): readonly ColorPin[] {
  return pins.map((p) =>
    Object.freeze({
      id: p.id,
      imageX: p.imageX,
      imageY: p.imageY,
      radiusPx: p.radiusPx,
      color: p.color,
    }),
  );
}

export function colorPinsEqual(a: readonly ColorPin[], b: readonly ColorPin[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    const u = a[i]!;
    const v = b[i]!;
    if (
      u.id !== v.id ||
      u.imageX !== v.imageX ||
      u.imageY !== v.imageY ||
      u.radiusPx !== v.radiusPx ||
      u.color !== v.color
    ) {
      return false;
    }
  }
  return true;
}
