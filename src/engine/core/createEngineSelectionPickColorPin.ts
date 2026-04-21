/**
 * Factory for `ImpastoEngineSelectionApi.pickColorPin` — modifier interpretation and selection mutation
 * stay in `selection/`; this module only binds `SelectionState` + dispose guard.
 */

import {
  applyColorPinPointerSelection,
  colorPinPickIntentFromModifierKeys,
} from '../selection/colorPinPointerSelection';
import type { SelectionState } from '../selection/SelectionState';
import type { ImpastoEngineSelectionApi } from './ImpastoEngineApi';

type CreateEngineSelectionPickColorPinDeps = {
  readonly selection: SelectionState;
  readonly ensureLive: () => void;
};

export function createEngineSelectionPickColorPin(
  deps: CreateEngineSelectionPickColorPinDeps,
): ImpastoEngineSelectionApi['pickColorPin'] {
  return (clickedPinId, modifiers) => {
    deps.ensureLive();
    const intent = colorPinPickIntentFromModifierKeys(modifiers);
    const next = applyColorPinPointerSelection(deps.selection.getAll(), clickedPinId, intent);
    deps.selection.set(next);
  };
}
