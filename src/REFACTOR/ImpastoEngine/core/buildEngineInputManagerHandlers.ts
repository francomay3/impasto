/**
 * Keyboard host callbacks for {@link attachInputManager}. Centralizes delete/undo wiring so the engine
 * constructor stays a thin composition root.
 */

import type { ColorPinCoordinator } from '../colorPins/ColorPinCoordinator';
import type { HistoryManager } from '../history/HistoryManager';
import { nudgeSampleColorBrushByHotkey } from '../input/engineHotkeyActions';
import {
  deleteSelectedEntries,
  selectionStateHasDeletableSelection,
} from '../selection/selectionDeletion';
import type { SelectionState } from '../selection/SelectionState';
import type { ToolState } from '../tools/ToolState';
import type { InputManagerHandlers } from './attachInputManager';
import type { ImpastoEngineColorPinsApi } from './ImpastoEngineApi';

type BuildEngineInputManagerHandlersDeps = {
  readonly toolState: ToolState;
  readonly selection: SelectionState;
  readonly colorPins: ImpastoEngineColorPinsApi;
  readonly colorPinCoordinator: ColorPinCoordinator;
  readonly history: HistoryManager;
  readonly ensureLive: () => void;
};

export function buildEngineInputManagerHandlers(
  deps: BuildEngineInputManagerHandlersDeps,
): InputManagerHandlers {
  return {
    getActiveToolId: () => deps.toolState.getState().activeTool.id,
    setActiveTool: (tool) => deps.toolState.setActiveTool(tool),
    nudgeSampleColorBrush: (deltaSteps) => nudgeSampleColorBrushByHotkey(deps.toolState, deltaSteps),
    deleteSelected: () => {
      deps.ensureLive();
      deleteSelectedEntries(deps.selection, {
        removeColorPins: (ids) => {
          deps.colorPins.removeMany(ids);
        },
      });
    },
    hasDeletableSelection: () => selectionStateHasDeletableSelection(deps.selection),
    historyBack: () => {
      deps.ensureLive();
      deps.colorPinCoordinator.abortDrag();
      deps.history.back();
    },
    historyForward: () => {
      deps.ensureLive();
      deps.colorPinCoordinator.abortDrag();
      deps.history.forward();
    },
  };
}
