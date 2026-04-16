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
import { ColorPinPointerDragSession } from '../colorPins/ColorPinPointerDragSession';
import { ColorPinState } from '../colorPins/ColorPinState';
import { EnginePaletteSync } from '../colorPins/enginePaletteSync';
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

export function buildImpastoEngineBootMid(lifecycle: ImpastoEngineLifecycle): ImpastoEngineBootMid {
  const ensureNotDisposed = () => {
    if (lifecycle.disposed) {
      throw new Error('ImpastoEngine: used after dispose');
    }
  };

  const viewportPipelineStateListeners = new ListenerRegistry<[ViewportPipelineState]>();
  const pipelineRef: { current?: ViewportPipeline } = {};

  const _viewportPhysics = new ViewportPhysics();
  const _viewportHub = new ViewportHub(_viewportPhysics);
  const _inputManager = new InputManager();
  const _historyManager = new HistoryManager();
  const _colorPinDragSession = new ColorPinPointerDragSession();
  const _toolState = new ToolState();
  const _colorPins = new ColorPinState();
  const _selection = new SelectionState();
  const _marqueeGesture = new MarqueeGestureState();

  const _paletteSync = new EnginePaletteSync(
    _colorPins,
    () => pipelineRef.current,
    () => lifecycle.disposed,
  );
  const _unsubscribeColorPins = _colorPins.subscribe(() => {
    _paletteSync.scheduleRebuild();
  });

  const _sourceImageCoordinator = new SourceImageCoordinator(_historyManager, ensureNotDisposed);

  const getColorPinRasterExtents = () =>
    colorPinRasterExtentsFromImages(
      pipelineRef.current?.getLastFilteredImage() ?? null,
      _sourceImageCoordinator.getImage(),
    );

  const _colorPinCoordinator = new ColorPinCoordinator(
    _colorPins,
    _colorPinDragSession,
    _historyManager,
    (ids) => _selection.pruneColorPinsToValidIds(ids),
    (entries) => _selection.set(entries),
    getColorPinRasterExtents,
    () => pipelineRef.current?.getLastFilteredImage() ?? null,
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
    _selection,
    _marqueeGesture,
    _paletteSync,
    _unsubscribeColorPins,
    _sourceImageCoordinator,
    _colorPinCoordinator,
  };
}
