/**
 * Resolves raster extents for color-pin placement (filtered output preferred, else source image).
 *
 * **Invariants:** Returns non-null only when the chosen raster has positive width and height — matches the
 * engine’s prior “placement follows whichever bitmap is actually usable” behaviour.
 *
 * **Coupling:** Used from boot when wiring `ColorPinCoordinator.getPlacementExtents` so pins clamp to the same
 * extents users see in the viewport (filtered pipeline output when warmed up).
 */

import type { RawImage } from '../../../types';
import type { ImpastoEngineColorPinPlacementExtents } from './ImpastoEngineApi';

export function colorPinRasterExtentsFromImages(
  filtered: RawImage | null,
  source: RawImage | null,
): ImpastoEngineColorPinPlacementExtents | null {
  if (filtered && filtered.width > 0 && filtered.height > 0) {
    return { width: filtered.width, height: filtered.height };
  }
  if (source && source.width > 0 && source.height > 0) {
    return { width: source.width, height: source.height };
  }
  return null;
}
