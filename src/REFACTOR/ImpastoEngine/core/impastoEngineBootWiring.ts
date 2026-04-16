/**
 * Second half of engine boot: public façade objects, {@link ViewportPipeline}, filters, and input attachment.
 *
 * **Invariants:** Assigns `pipelineRef.current` exactly once after `createViewportPipeline` so earlier-registered
 * listeners (palette, pin coordinator) observe a stable pipeline reference. `attachInputManager` runs last so every
 * handler closure captures fully wired façade APIs.
 *
 * **Coupling:** Imports both thin factories (`buildEngineApis`) and history-bearing helpers (`buildEngineFiltersApi`,
 * `buildEngineCanvasInputHost`) — this is the intentional seam where composition-root behaviour is assembled.
 */

import { attachInputManager } from './attachInputManager';
import {
  buildManagersApi,
  buildMarqueeApi,
  buildPipelineApi,
  buildSelectionApi,
  buildToolsApi,
  buildViewportsApi,
  buildViewportApi,
} from './buildEngineApis';
import { buildEngineCanvasInputHost } from './buildEngineCanvasInputHost';
import { buildEngineFiltersApi } from './buildEngineFiltersApi';
import { buildEngineInputManagerHandlers } from './buildEngineInputManagerHandlers';
import { createEngineSelectionPickColorPin } from './createEngineSelectionPickColorPin';
import { createViewportPipeline } from './createViewportPipeline';
import type { ImpastoEngineBootMid } from './impastoEngineBootTypes';
import type {
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
import type { ViewportPipeline } from '../pipeline/ViewportPipeline';

type ImpastoEngineBootWiredApis = {
  readonly viewport: ImpastoEngineViewportApi;
  readonly image: ImpastoEngineImageApi;
  readonly managers: ImpastoEngineManagersApi;
  readonly tools: ImpastoEngineToolsApi;
  readonly colorPins: ImpastoEngineColorPinsApi;
  readonly selection: ImpastoEngineSelectionApi;
  readonly marquee: ImpastoEngineMarqueeApi;
  readonly filters: ImpastoEngineFiltersApi;
  readonly pipeline: ImpastoEnginePipelineApi;
  readonly viewports: ImpastoEngineViewports;
  readonly _viewportPipeline: ViewportPipeline;
};

export function wireImpastoEngineApis(mid: ImpastoEngineBootMid): ImpastoEngineBootWiredApis {
  const { ensureNotDisposed, viewportPipelineStateListeners, pipelineRef } = mid;

  const viewport = buildViewportApi({
    physics: mid._viewportPhysics,
    hub: mid._viewportHub,
    ensureLive: ensureNotDisposed,
  });

  const image = mid._sourceImageCoordinator.buildApi();

  const managers = buildManagersApi(mid._inputManager, mid._historyManager);

  const tools = buildToolsApi({
    tools: mid._toolState,
    ensureLive: ensureNotDisposed,
  });

  const colorPins = mid._colorPinCoordinator.buildApi();

  const selection = buildSelectionApi({
    selection: mid._selection,
    pickColorPin: createEngineSelectionPickColorPin({
      selection: mid._selection,
      ensureLive: ensureNotDisposed,
    }),
  });

  const marquee = buildMarqueeApi(mid._marqueeGesture);

  const _viewportPipeline = createViewportPipeline({
    imageDep: image,
    viewportPhysics: mid._viewportPhysics,
    viewportSubscribe: (v) => mid._viewportHub.subscribe(v),
    onStateChange: (state) => {
      viewportPipelineStateListeners.notify(state);
    },
    canvasInputHost: buildEngineCanvasInputHost({
      toolState: mid._toolState,
      selection: mid._selection,
      marqueeGesture: mid._marqueeGesture,
      colorPinsState: mid._colorPins,
      colorPins,
      ensureLive: ensureNotDisposed,
    }),
    onFilteredImageOutput: (img) => mid._paletteSync.flushFromPins(img),
  });
  pipelineRef.current = _viewportPipeline;

  const filters = buildEngineFiltersApi({
    ensureLive: ensureNotDisposed,
    pipeline: _viewportPipeline,
    history: mid._historyManager,
  });

  const pipeline = buildPipelineApi({
    pipeline: _viewportPipeline,
    subscribeState: (listener) => viewportPipelineStateListeners.add(listener),
  });

  const viewports = buildViewportsApi(_viewportPipeline);

  mid._paletteSync.scheduleRebuild();

  attachInputManager(
    mid._inputManager,
    buildEngineInputManagerHandlers({
      toolState: mid._toolState,
      selection: mid._selection,
      colorPins,
      colorPinCoordinator: mid._colorPinCoordinator,
      history: mid._historyManager,
      ensureLive: ensureNotDisposed,
    }),
  );

  return {
    viewport,
    image,
    managers,
    tools,
    colorPins,
    selection,
    marquee,
    filters,
    pipeline,
    viewports,
    _viewportPipeline,
  };
}
