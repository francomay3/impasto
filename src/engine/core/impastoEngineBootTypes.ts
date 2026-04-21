/**
 * Shared types for {@link createImpastoEngineBoot} so mid-stage construction and pipeline wiring can stay in
 * separate modules without circular imports.
 *
 * **Invariants:** `ImpastoEngineLifecycle` is a mutable object shared with {@link ImpastoEngine} — dispose sets
 * `disposed` in place so all closures see the same flag without polling the engine instance.
 *
 * **Coupling:** Aggregates type-only references across `colorPins/`, `pipeline/`, `selection/`, `viewport/`, etc.
 * Keeps value imports out of this file so `impastoEngineBootMid` ↔ `impastoEngineBootWiring` stay acyclic.
 */

import type { EnginePaletteSync } from '../colorPins/enginePaletteSync';
import type { ColorPinCoordinator } from '../colorPins/ColorPinCoordinator';
import type { ColorPinGroupState } from '../colorPins/ColorPinGroupState';
import type { ColorPinPointerDragSession } from '../colorPins/ColorPinPointerDragSession';
import type { ColorPinState } from '../colorPins/ColorPinState';
import type { HistoryManager } from '../history/HistoryManager';
import type { InputManager } from '../input/InputManager';
import type { ListenerRegistry } from '../infra/listenerRegistry';
import type { ViewportPipeline, ViewportPipelineState } from '../pipeline/ViewportPipeline';
import type { MarqueeGestureState } from '../selection/MarqueeGestureState';
import type { SelectionState } from '../selection/SelectionState';
import type { ToolState } from '../tools/ToolState';
import type { ViewportHub } from '../viewport/viewportHub';
import type { ViewportPhysics } from '../viewport/ViewportPhysics';
import type { SourceImageCoordinator } from './SourceImageCoordinator';
import type {
  ImpastoEngineColorPinGroupsApi,
  ImpastoEngineColorPinsApi,
  ImpastoEngineFiltersApi,
  ImpastoEngineImageApi,
  ImpastoEngineManagersApi,
  ImpastoEngineMarqueeApi,
  ImpastoEnginePipelineApi,
  ImpastoEngineSelectionApi,
  ImpastoEngineToolsApi,
  ImpastoEngineViewports,
  ImpastoEngineViewportApi,
} from './ImpastoEngineApi';

/** Mutable dispose flag shared with {@link ImpastoEngine} (same object reference). */
export type ImpastoEngineLifecycle = { disposed: boolean };

/** Subsystems + façade objects assigned onto {@link ImpastoEngine} from the boot factory. */
export type ImpastoEngineBoot = {
  readonly _inputManager: InputManager;
  readonly _historyManager: HistoryManager;
  readonly _colorPinDragSession: ColorPinPointerDragSession;
  readonly _colorPins: ColorPinState;
  readonly _colorPinCoordinator: ColorPinCoordinator;
  readonly _marqueeGesture: MarqueeGestureState;
  readonly _sourceImageCoordinator: SourceImageCoordinator;
  readonly _viewportPipeline: ViewportPipeline;
  readonly _unsubscribeColorPins: () => void;
  readonly viewport: ImpastoEngineViewportApi;
  readonly image: ImpastoEngineImageApi;
  readonly managers: ImpastoEngineManagersApi;
  readonly tools: ImpastoEngineToolsApi;
  readonly colorPins: ImpastoEngineColorPinsApi;
  readonly colorPinGroups: ImpastoEngineColorPinGroupsApi;
  readonly selection: ImpastoEngineSelectionApi;
  readonly marquee: ImpastoEngineMarqueeApi;
  readonly filters: ImpastoEngineFiltersApi;
  readonly pipeline: ImpastoEnginePipelineApi;
  readonly viewports: ImpastoEngineViewports;
};

/** Internal graph built before `createViewportPipeline` (everything that pipeline + APIs close over). */
export type ImpastoEngineBootMid = {
  readonly ensureNotDisposed: () => void;
  readonly viewportPipelineStateListeners: ListenerRegistry<[ViewportPipelineState]>;
  readonly pipelineRef: { current?: ViewportPipeline };
  readonly _viewportPhysics: ViewportPhysics;
  readonly _viewportHub: ViewportHub;
  readonly _inputManager: InputManager;
  readonly _historyManager: HistoryManager;
  readonly _colorPinDragSession: ColorPinPointerDragSession;
  readonly _toolState: ToolState;
  readonly _colorPins: ColorPinState;
  readonly _colorPinGroups: ColorPinGroupState;
  readonly _selection: SelectionState;
  readonly _marqueeGesture: MarqueeGestureState;
  readonly _paletteSync: EnginePaletteSync;
  readonly _unsubscribeColorPins: () => void;
  readonly _sourceImageCoordinator: SourceImageCoordinator;
  readonly _colorPinCoordinator: ColorPinCoordinator;
};
