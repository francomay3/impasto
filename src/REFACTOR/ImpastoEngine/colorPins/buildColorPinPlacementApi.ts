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
 */

import type { RawImage } from '../../../types';
import type { ImpastoEngineColorPinPlacementExtents, ImpastoEngineColorPinsPlacementApi } from '../core/ImpastoEngineApi';
import { cloneColorPinSnapshot } from '../core/colorPinHistorySnapshot';
import { clampImagePointInsideRaster, isPointInsideImageExtents } from '../infra/imageRect';
import { colorPinEntry, type SelectionEntry } from '../infra/selectionEntry';
import { samplePinColorFromFilteredImage } from './indexedPaletteFromColorPins';
import type { ColorPin, ColorPinAddPayload, ColorPinState } from './ColorPinState';

/** Narrow surface passed from {@link ColorPinCoordinator.buildApi} — avoids a circular import with the coordinator. */
type ColorPinPlacementApiHost = {
  readonly ensureLive: () => void;
  readonly commitDrag: () => void;
  readonly pushColorPinHistoryIfChanged: (before: readonly ColorPin[], after: readonly ColorPin[]) => void;
  readonly colorPins: ColorPinState;
  readonly pruneSelection: (validIds: Set<string>) => void;
  readonly setSelection: (entries: readonly SelectionEntry[]) => void;
  readonly getPlacementExtents: () => ImpastoEngineColorPinPlacementExtents | null;
  readonly getLastFilteredImage: () => RawImage | null;
};

export function buildColorPinPlacementApi(host: ColorPinPlacementApiHost): ImpastoEngineColorPinsPlacementApi {
  return {
    getAll: () => host.colorPins.getAll(),
    subscribe: (listener) => host.colorPins.subscribe(listener),
    getPlacementExtents: () => host.getPlacementExtents(),
    clear: () => {
      host.ensureLive();
      host.commitDrag();
      const before = cloneColorPinSnapshot(host.colorPins.getAll());
      if (before.length === 0) {
        return;
      }
      host.colorPins.clear();
      host.pruneSelection(new Set());
      const after = cloneColorPinSnapshot(host.colorPins.getAll());
      host.pushColorPinHistoryIfChanged(before, after);
    },
    add: (payload: ColorPinAddPayload) => {
      host.ensureLive();
      const extent = host.getPlacementExtents();
      if (extent && !isPointInsideImageExtents(payload.imageX, payload.imageY, extent.width, extent.height)) {
        return;
      }
      const before = cloneColorPinSnapshot(host.colorPins.getAll());
      const sampledColorHex =
        samplePinColorFromFilteredImage(host.getLastFilteredImage(), payload) ?? '#868e96';
      const id = host.colorPins.addFromSample(payload, sampledColorHex);
      host.setSelection([colorPinEntry(id)]);
      const after = cloneColorPinSnapshot(host.colorPins.getAll());
      host.pushColorPinHistoryIfChanged(before, after);
    },
    repositionMany: (updates) => {
      host.ensureLive();
      const extent = host.getPlacementExtents();
      if (!extent || updates.length === 0) {
        return;
      }
      const filtered = host.getLastFilteredImage();
      const pinById = new Map(host.colorPins.getAll().map((p) => [p.id, p]));
      const clamped: {
        readonly id: string;
        readonly imageX: number;
        readonly imageY: number;
        readonly color: string;
      }[] = [];
      for (const u of updates) {
        const row = pinById.get(u.id);
        if (!row) {
          continue;
        }
        const c = clampImagePointInsideRaster(u.imageX, u.imageY, extent.width, extent.height);
        const color =
          samplePinColorFromFilteredImage(filtered, {
            imageX: c.x,
            imageY: c.y,
            radiusPx: row.radiusPx,
          }) ?? '#868e96';
        clamped.push({ id: u.id, imageX: c.x, imageY: c.y, color });
      }
      if (clamped.length === 0) {
        return;
      }
      host.colorPins.repositionMany(clamped);
    },
    remove: (id) => {
      host.ensureLive();
      host.commitDrag();
      const before = cloneColorPinSnapshot(host.colorPins.getAll());
      host.colorPins.removeById(id);
      host.pruneSelection(new Set(host.colorPins.getAll().map((p) => p.id)));
      const after = cloneColorPinSnapshot(host.colorPins.getAll());
      host.pushColorPinHistoryIfChanged(before, after);
    },
    removeMany: (ids) => {
      host.ensureLive();
      if (ids.length === 0) {
        return;
      }
      host.commitDrag();
      const before = cloneColorPinSnapshot(host.colorPins.getAll());
      host.colorPins.removeByIds(ids);
      host.pruneSelection(new Set(host.colorPins.getAll().map((p) => p.id)));
      const after = cloneColorPinSnapshot(host.colorPins.getAll());
      host.pushColorPinHistoryIfChanged(before, after);
    },
  };
}
