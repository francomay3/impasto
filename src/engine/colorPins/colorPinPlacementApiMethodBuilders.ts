import { clampImagePointInsideRaster, isPointInsideImageExtents } from '../infra/imageRect';
import { cloneColorPinSnapshot } from '../core/colorPinHistorySnapshot';
import { samplePinColorFromFilteredImage } from './indexedPaletteFromColorPins';
import type { ColorPinAddPayload } from './ColorPinState';
import type { ColorPinPlacementApiHost } from './colorPinPlacementApiHost';

export function buildPlacementClear(host: ColorPinPlacementApiHost): () => void {
  return () => {
    host.ensureLive();
    host.commitDrag();
    const before = cloneColorPinSnapshot(host.colorPins.getAll());
    host.colorPins.clear();
    host.pruneSelection(new Set());
    const after = cloneColorPinSnapshot(host.colorPins.getAll());
    host.pushColorPinHistoryIfChanged(before, after);
  };
}

export function buildPlacementAdd(host: ColorPinPlacementApiHost): (payload: ColorPinAddPayload) => void {
  return (payload) => {
    host.ensureLive();
    host.commitDrag();
    const extents = host.getPlacementExtents();
    if (!extents) {
      return;
    }
    // Reject clicks outside the half-open raster; clamping alone would map edge-straddling picks onto existing
    // pins (e.g. x === width on a 1×1 image) and silently duplicate placements.
    if (!isPointInsideImageExtents(payload.imageX, payload.imageY, extents.width, extents.height)) {
      return;
    }
    const { x, y } = clampImagePointInsideRaster(payload.imageX, payload.imageY, extents.width, extents.height);
    const filtered = host.getLastFilteredImage();
    const color =
      samplePinColorFromFilteredImage(filtered, { imageX: x, imageY: y, radiusPx: payload.radiusPx }) ?? '#868e96';
    const before = cloneColorPinSnapshot(host.colorPins.getAll());
    host.colorPins.addFromSample({ ...payload, imageX: x, imageY: y }, color);
    host.pruneSelection(new Set(host.colorPins.getAll().map((p) => p.id)));
    const after = cloneColorPinSnapshot(host.colorPins.getAll());
    host.pushColorPinHistoryIfChanged(before, after);
  };
}

export function buildPlacementRemove(host: ColorPinPlacementApiHost): (id: string) => void {
  return (id) => {
    host.ensureLive();
    host.commitDrag();
    const before = cloneColorPinSnapshot(host.colorPins.getAll());
    host.colorPins.removeById(id);
    host.pruneSelection(new Set(host.colorPins.getAll().map((p) => p.id)));
    const after = cloneColorPinSnapshot(host.colorPins.getAll());
    host.pushColorPinHistoryIfChanged(before, after);
  };
}

export function buildPlacementRemoveMany(host: ColorPinPlacementApiHost): (ids: readonly string[]) => void {
  return (ids) => {
    host.ensureLive();
    host.commitDrag();
    if (ids.length === 0) {
      return;
    }
    const before = cloneColorPinSnapshot(host.colorPins.getAll());
    host.colorPins.removeByIds(ids);
    host.pruneSelection(new Set(host.colorPins.getAll().map((p) => p.id)));
    const after = cloneColorPinSnapshot(host.colorPins.getAll());
    host.pushColorPinHistoryIfChanged(before, after);
  };
}

export function buildPlacementReorderTo(host: ColorPinPlacementApiHost): (orderedIds: readonly string[]) => void {
  return (orderedIds) => {
    host.ensureLive();
    host.commitDrag();
    const pins = host.colorPins.getAll();
    if (orderedIds.length === 0 || orderedIds.length !== pins.length) {
      return;
    }
    if (new Set(orderedIds).size !== orderedIds.length) {
      return;
    }
    const byId = new Map(pins.map((p) => [p.id, p]));
    const next: (typeof pins)[number][] = [];
    for (const id of orderedIds) {
      const p = byId.get(id);
      if (!p) {
        return;
      }
      next.push(p);
    }
    let same = true;
    for (let i = 0; i < pins.length; i += 1) {
      if (pins[i]!.id !== next[i]!.id) {
        same = false;
        break;
      }
    }
    if (same) {
      return;
    }
    const before = cloneColorPinSnapshot(pins);
    host.colorPins.setAllPins(next);
    host.pruneSelection(new Set(next.map((p) => p.id)));
    const after = cloneColorPinSnapshot(host.colorPins.getAll());
    host.pushColorPinHistoryIfChanged(before, after);
  };
}

export function buildPlacementRepositionMany(
  host: ColorPinPlacementApiHost,
): (updates: readonly { readonly id: string; readonly imageX: number; readonly imageY: number }[]) => void {
  return (updates) => {
    host.ensureLive();
    if (updates.length === 0) {
      return;
    }
    const extents = host.getPlacementExtents();
    if (!extents) {
      return;
    }
    const filtered = host.getLastFilteredImage();
    const byId = new Map(host.colorPins.getAll().map((p) => [p.id, p]));
    const full: { id: string; imageX: number; imageY: number; color: string }[] = [];
    for (const u of updates) {
      const pin = byId.get(u.id);
      if (!pin) {
        continue;
      }
      const { x, y } = clampImagePointInsideRaster(u.imageX, u.imageY, extents.width, extents.height);
      const color =
        samplePinColorFromFilteredImage(filtered, { imageX: x, imageY: y, radiusPx: pin.radiusPx }) ?? pin.color;
      full.push({ id: u.id, imageX: x, imageY: y, color });
    }
    if (full.length === 0) {
      return;
    }
    host.colorPins.repositionMany(full);
  };
}
