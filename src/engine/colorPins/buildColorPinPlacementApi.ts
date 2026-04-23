/**
 * Factory for the pin-list / placement slice of {@link ImpastoEngineColorPinsApi}.
 *
 * Lives beside {@link ColorPinCoordinator} so the coordinator module stays within the file-length budget while
 * keeping all sampling and clamping rules in one testable place.
 *
 * **Invariants:** Mutations call `ensureLive` + `commitDrag` first so pointer-drag sessions never race list edits.
 * Placement uses `clampImagePointInsideRaster` against `getPlacementExtents` — same raster policy as the coordinator.
 *
 * **Coupling:** Receives history + selection callbacks via {@link ColorPinPlacementApiHost} so this file never
 * imports `HistoryManager` or `SelectionState` directly (keeps the factory a pure function of its host bag).
 *
 * Method bodies live in `colorPinPlacementApiMethodBuilders.ts` to satisfy `max-lines-per-function`.
 */

import type { ImpastoEngineColorPinsPlacementApi } from '../core/ImpastoEngineApi';
import {
  buildPlacementAdd,
  buildPlacementClear,
  buildPlacementRemove,
  buildPlacementRemoveMany,
  buildPlacementReorderTo,
  buildPlacementRepositionMany,
} from './colorPinPlacementApiMethodBuilders';
import type { ColorPinPlacementApiHost } from './colorPinPlacementApiHost';

export function buildColorPinPlacementApi(
  host: ColorPinPlacementApiHost
): ImpastoEngineColorPinsPlacementApi {
  return {
    getAll: () => host.colorPins.getAll(),
    subscribe: (listener) => host.colorPins.subscribe(listener),
    getPlacementExtents: () => host.getPlacementExtents(),
    clear: buildPlacementClear(host),
    add: buildPlacementAdd(host),
    repositionMany: buildPlacementRepositionMany(host),
    remove: buildPlacementRemove(host),
    removeMany: buildPlacementRemoveMany(host),
    reorderTo: buildPlacementReorderTo(host),
  };
}
