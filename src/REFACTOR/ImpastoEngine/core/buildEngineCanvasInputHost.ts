/**
 * Builds the {@link ViewportCanvasInputHost} wired into {@link ViewportPipeline} canvas surfaces.
 *
 * Owns marquee drag application, canvas hit selection clearing, and filtered/indexed-surface color-pin drops.
 * Lives in `core/` because it stitches tool state, selection, marquee gesture, and color pins — the same
 * composition-root seams as {@link ImpastoEngine}, but without importing `ImpastoEngine` (deps are injected).
 */

import type { ColorPinState } from '../colorPins/ColorPinState';
import { MARQUEE_DRAG_EPSILON_IMAGE_PX } from '../infra/marqueeConstants';
import { isBelowDragEpsilon, normalizeImageRect } from '../infra/imageRect';
import { applyMarqueeSelection } from '../selection/marqueeSelectionApply';
import { effectiveMarqueeMode } from '../selection/effectiveMarqueeMode';
import type { MarqueeGestureState } from '../selection/MarqueeGestureState';
import type { SelectionState } from '../selection/SelectionState';
import { marqueeUiModeFromToolsState } from '../tools/MarqueeTool';
import type { ToolState } from '../tools/ToolState';
import type { ViewportCanvasInputHost } from '../viewports/canvas/host/viewportInputPolicy';
import type { ImpastoEngineColorPinsApi } from './ImpastoEngineApi';

/** Subsystems required to implement canvas pointer + marquee behaviour for viewport canvases. */
type BuildEngineCanvasInputHostDeps = {
  readonly toolState: ToolState;
  readonly selection: SelectionState;
  readonly marqueeGesture: MarqueeGestureState;
  readonly colorPinsState: ColorPinState;
  readonly colorPins: Pick<ImpastoEngineColorPinsApi, 'add'>;
  readonly ensureLive: () => void;
};

export function buildEngineCanvasInputHost(deps: BuildEngineCanvasInputHostDeps): ViewportCanvasInputHost {
  const { toolState, selection, marqueeGesture, colorPinsState, colorPins, ensureLive } = deps;

  return {
    getToolsState: () => toolState.getState(),
    subscribeTools: (listener) => toolState.subscribe(listener),

    addColorPinFromSample: (payload) => {
      if (payload.surface !== 'filtered' && payload.surface !== 'indexed') {
        return;
      }
      colorPins.add({
        imageX: payload.imageX,
        imageY: payload.imageY,
        radiusPx: payload.radiusPx,
      });
    },

    onCanvasPointerDownBeforeTools: (info) => {
      if (info.button === 0 && toolState.getState().activeTool.id === 'marquee-select') {
        return;
      }
      selection.clear();
    },

    marqueeDragStart: (payload) => {
      ensureLive();
      marqueeGesture.start(payload.surface, { x: payload.imageX, y: payload.imageY });
    },

    marqueeDragMove: (payload) => {
      ensureLive();
      marqueeGesture.move({ x: payload.imageX, y: payload.imageY });
    },

    marqueeDragEnd: (payload) => {
      ensureLive();
      const draft = marqueeGesture.getDraft();
      marqueeGesture.clear();
      if (!draft || draft.surface !== payload.surface) {
        return;
      }
      const start = draft.start;
      const end = { x: payload.imageX, y: payload.imageY };
      if (isBelowDragEpsilon(start, end, MARQUEE_DRAG_EPSILON_IMAGE_PX)) {
        selection.clear();
        return;
      }
      const uiMode = marqueeUiModeFromToolsState(toolState.getState().activeTool);
      const mode = effectiveMarqueeMode(uiMode, {
        shiftKey: payload.shiftKey,
        altKey: payload.altKey,
      });
      const rect = normalizeImageRect(start, end);
      const hitIds = colorPinsState.queryColorPinIdsInImageRect(rect);
      const next = applyMarqueeSelection(selection.getAll(), hitIds, mode);
      selection.set(next);
    },
  };
}
