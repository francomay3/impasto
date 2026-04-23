/**
 * First half of engine boot: subsystems that exist before {@link createViewportPipeline} is invoked.
 *
 * **Invariants:** `pipelineRef` starts empty and is filled by {@link wireImpastoEngineApis} after
 * `createViewportPipeline` — callbacks that must reach the pipeline (palette sync, pin placement sampling) close
 * over `pipelineRef.current` so they are null-safe before wiring completes.
 *
 * **Coupling:** Instantiates `selection/`, `tools/`, `colorPins/`, and `history/` directly; the second boot stage
 * attaches `ViewportPipeline` and builds the public API objects that reference those instances.
 */

import { ColorPinCoordinator } from '../colorPins/ColorPinCoordinator';
import { ColorPinGroupState } from '../colorPins/ColorPinGroupState';
import { ColorPinPointerDragSession } from '../colorPins/ColorPinPointerDragSession';
import { ColorPinState } from '../colorPins/ColorPinState';
import { EnginePaletteSync } from '../colorPins/enginePaletteSync';
import { SampledPaletteResolver } from '../palette/SampledPaletteResolver';
import { ResolvedPaletteState } from '../palette/ResolvedPaletteState';
import { HistoryManager } from '../history/HistoryManager';
import { InputManager } from '../input/InputManager';
import { ListenerRegistry } from '../infra/listenerRegistry';
import type { ViewportPipeline, ViewportPipelineState } from '../pipeline/ViewportPipeline';
import { MarqueeGestureState } from '../selection/MarqueeGestureState';
import { SelectionState } from '../selection/SelectionState';
import { ToolState } from '../tools/ToolState';
import { ViewportHub } from '../viewport/viewportHub';
import { ViewportPhysics } from '../viewport/ViewportPhysics';
import { colorPinRasterExtentsFromImages } from './colorPinRasterExtents';
import type { ImpastoEngineBootMid, ImpastoEngineLifecycle } from './impastoEngineBootTypes';
import { SourceImageCoordinator } from './SourceImageCoordinator';

function createEnsureNotDisposed(lifecycle: ImpastoEngineLifecycle): () => void {
  return () => {
    if (lifecycle.disposed) {
      throw new Error('ImpastoEngine: used after dispose');
    }
  };
}

function createEnginePaletteSyncSection(
  colorPins: ColorPinState,
  pipelineRef: { current?: ViewportPipeline },
  lifecycle: ImpastoEngineLifecycle,
): {
  paletteSync: EnginePaletteSync;
  resolvedPalette: ResolvedPaletteState;
  unsubscribeColorPins: () => void;
} {
  const resolvedPalette = new ResolvedPaletteState();
  const paletteSync = new EnginePaletteSync(
    colorPins,
    () => pipelineRef.current,
    () => lifecycle.disposed,
    resolvedPalette,
    new SampledPaletteResolver(),
  );
  const unsubscribeColorPins = colorPins.subscribe(() => {
    paletteSync.scheduleRebuild();
  });
  return { paletteSync, resolvedPalette, unsubscribeColorPins };
}

function createBootColorPinCoordinator(
  pipelineRef: { current?: ViewportPipeline },
  colorPins: ColorPinState,
  colorPinGroups: ColorPinGroupState,
  colorPinDragSession: ColorPinPointerDragSession,
  historyManager: HistoryManager,
  selection: SelectionState,
  sourceImageCoordinator: SourceImageCoordinator,
  ensureNotDisposed: () => void,
): ColorPinCoordinator {
  const getColorPinRasterExtents = () =>
    colorPinRasterExtentsFromImages(
      pipelineRef.current?.getLastFilteredImage() ?? null,
      sourceImageCoordinator.getImage(),
    );

  return new ColorPinCoordinator(
    colorPins,
    colorPinDragSession,
    historyManager,
    (ids) => selection.pruneColorPinsToValidIds(ids),
    (entries) => selection.set(entries),
    getColorPinRasterExtents,
    () => pipelineRef.current?.getLastFilteredImage() ?? null,
    ensureNotDisposed,
    () => colorPinGroups.getAll(),
  );
}

export function buildImpastoEngineBootMid(lifecycle: ImpastoEngineLifecycle): ImpastoEngineBootMid {
  const ensureNotDisposed = createEnsureNotDisposed(lifecycle);
  const viewportPipelineStateListeners = new ListenerRegistry<[ViewportPipelineState]>();
  const pipelineRef: { current?: ViewportPipeline } = {};
  const _viewportPhysics = new ViewportPhysics();
  const _viewportHub = new ViewportHub(_viewportPhysics);
  const _inputManager = new InputManager();
  const _historyManager = new HistoryManager();
  const _colorPinDragSession = new ColorPinPointerDragSession();
  const _toolState = new ToolState();
  const _colorPins = new ColorPinState();
  const _colorPinGroups = new ColorPinGroupState();
  const _selection = new SelectionState();
  const _marqueeGesture = new MarqueeGestureState();
  const {
    paletteSync: _paletteSync,
    resolvedPalette: _resolvedPalette,
    unsubscribeColorPins: _unsubscribeColorPins,
  } = createEnginePaletteSyncSection(_colorPins, pipelineRef, lifecycle);
  const _sourceImageCoordinator = new SourceImageCoordinator(_historyManager, ensureNotDisposed);
  const _colorPinCoordinator = createBootColorPinCoordinator(
    pipelineRef,
    _colorPins,
    _colorPinGroups,
    _colorPinDragSession,
    _historyManager,
    _selection,
    _sourceImageCoordinator,
    ensureNotDisposed,
  );

  return {
    ensureNotDisposed,
    viewportPipelineStateListeners,
    pipelineRef,
    _viewportPhysics,
    _viewportHub,
    _inputManager,
    _historyManager,
    _colorPinDragSession,
    _toolState,
    _colorPins,
    _colorPinGroups,
    _selection,
    _marqueeGesture,
    _resolvedPalette,
    _paletteSync,
    _unsubscribeColorPins,
    _sourceImageCoordinator,
    _colorPinCoordinator,
  };
}
