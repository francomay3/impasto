import type { RawImage } from '../../types';
import type { ImpastoEngineColorPinPlacementExtents } from '../core/ImpastoEngineApi';
import type { SelectionEntry } from '../infra/selectionEntry';
import type { ColorPin, ColorPinState } from './ColorPinState';

/**
 * Dependencies for {@link buildColorPinPlacementApi} so method bodies stay out of {@link ColorPinCoordinator}
 * (file-length budget) without importing `HistoryManager` / `SelectionState` into the factory module.
 */
export type ColorPinPlacementApiHost = {
  ensureLive: () => void;
  commitDrag: () => void;
  pushColorPinHistoryIfChanged: (before: readonly ColorPin[], after: readonly ColorPin[]) => void;
  colorPins: ColorPinState;
  pruneSelection: (validIds: Set<string>) => void;
  setSelection: (entries: readonly SelectionEntry[]) => void;
  getPlacementExtents: () => ImpastoEngineColorPinPlacementExtents | null;
  getLastFilteredImage: () => RawImage | null;
};
