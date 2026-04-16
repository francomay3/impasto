import { clampImagePointInsideRaster } from '../infra/imageRect';

type ColorPinRepositionUpdate = {
  readonly id: string;
  readonly imageX: number;
  readonly imageY: number;
};

/**
 * Moves every listed pin by the same image-space delta as the pointer, clamping each center to the raster.
 * Used by the overlay drag gesture so multi-selected pins stay locked together while respecting image bounds.
 */
export function repositionUpdatesForPointerImageDelta(
  startPointerImage: { readonly x: number; readonly y: number },
  currentPointerImage: { readonly x: number; readonly y: number },
  pinIds: readonly string[],
  startCenterById: ReadonlyMap<string, { readonly x: number; readonly y: number }>,
  rasterWidth: number,
  rasterHeight: number,
): ColorPinRepositionUpdate[] {
  const dx = currentPointerImage.x - startPointerImage.x;
  const dy = currentPointerImage.y - startPointerImage.y;
  const out: ColorPinRepositionUpdate[] = [];
  for (const id of pinIds) {
    const c = startCenterById.get(id);
    if (!c) {
      continue;
    }
    const { x, y } = clampImagePointInsideRaster(c.x + dx, c.y + dy, rasterWidth, rasterHeight);
    out.push({ id, imageX: x, imageY: y });
  }
  return out;
}
