/**
 * Centroid merge / add-middle blend for color pins.
 *
 * **Invariants:** Uses the same placement + sampling pipeline as the coordinator: filtered image when present,
 * geometric midpoint from {@link computeColorPinBlendPlacement}, then {@link samplePinColorFromFilteredImage}.
 *
 * **Coupling:** Pure functions + a small deps bag so {@link ColorPinCoordinator} stays under file-length limits.
 * Selection entry DTOs come from `infra/selectionEntry` so this module does not import `selection/`.
 */

import type { RawImage } from '../../../types';
import { colorPinEntry, type SelectionEntry } from '../infra/selectionEntry';
import { cloneColorPinSnapshot } from '../core/colorPinHistorySnapshot';
import { computeColorPinBlendPlacement } from './colorPinBlendPlacement';
import { samplePinColorFromFilteredImage } from './indexedPaletteFromColorPins';
import type { ColorPin, ColorPinState } from './ColorPinState';

/** Subset of coordinator state needed to run a blend without importing the coordinator class. */
type ColorPinBlendDeps = {
  readonly colorPins: ColorPinState;
  readonly getLastFilteredImage: () => RawImage | null;
  readonly setSelection: (entries: readonly SelectionEntry[]) => void;
  readonly pruneSelection: (validIds: Set<string>) => void;
  readonly pushColorPinHistoryIfChanged: (before: readonly ColorPin[], after: readonly ColorPin[]) => void;
};

function resolveColorPinsOrdered(
  colorPins: ColorPinState,
  ids: readonly string[],
): ReturnType<ColorPinState['getAll']>[number][] | null {
  const byId = new Map(colorPins.getAll().map((p) => [p.id, p]));
  const pins: ReturnType<ColorPinState['getAll']>[number][] = [];
  for (const id of ids) {
    const p = byId.get(id);
    if (p) {
      pins.push(p);
    }
  }
  return pins.length >= 2 ? pins : null;
}

/**
 * Blend two or more pins into one new pin at the geometric midpoint placement.
 * When `keepOriginals` is false (merge), source pins are removed; when true (add-middle), they remain.
 */
export function blendColorPinsFromIds(
  deps: ColorPinBlendDeps,
  ids: readonly string[],
  keepOriginals: boolean,
): void {
  const pins = resolveColorPinsOrdered(deps.colorPins, ids);
  if (!pins) {
    return;
  }
  const filtered = deps.getLastFilteredImage();
  const placement = computeColorPinBlendPlacement(filtered, pins);
  if (!placement) {
    return;
  }
  const before = cloneColorPinSnapshot(deps.colorPins.getAll());
  if (!keepOriginals) {
    deps.colorPins.removeByIds(pins.map((p) => p.id));
  }
  const sampledColorHex =
    samplePinColorFromFilteredImage(filtered, {
      imageX: placement.imageX,
      imageY: placement.imageY,
      radiusPx: placement.radiusPx,
    }) ?? '#868e96';
  const newId = deps.colorPins.addFromSample(
    {
      imageX: placement.imageX,
      imageY: placement.imageY,
      radiusPx: placement.radiusPx,
    },
    sampledColorHex,
  );
  deps.setSelection([colorPinEntry(newId)]);
  deps.pruneSelection(new Set(deps.colorPins.getAll().map((p) => p.id)));
  const after = cloneColorPinSnapshot(deps.colorPins.getAll());
  deps.pushColorPinHistoryIfChanged(before, after);
}
