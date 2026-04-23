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
import { buildEnginePaletteApi } from './buildEnginePaletteApi';
import { buildEngineInputManagerHandlers } from './buildEngineInputManagerHandlers';
import { createEngineSelectionPickColorPin } from './createEngineSelectionPickColorPin';
import { createViewportPipeline } from './createViewportPipeline';
import type { ImpastoEngineBootMid } from './impastoEngineBootTypes';
import type {
  ImpastoEngineColorPinGroupsApi,
  ImpastoEngineColorPinsApi,
  ImpastoEngineFiltersApi,
  ImpastoEngineImageApi,
  ImpastoEngineManagersApi,
  ImpastoEngineMarqueeApi,
  ImpastoEnginePaletteApi,
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
  readonly colorPinGroups: ImpastoEngineColorPinGroupsApi;
  readonly selection: ImpastoEngineSelectionApi;
  readonly marquee: ImpastoEngineMarqueeApi;
  readonly filters: ImpastoEngineFiltersApi;
  readonly palette: ImpastoEnginePaletteApi;
  readonly pipeline: ImpastoEnginePipelineApi;
  readonly viewports: ImpastoEngineViewports;
  readonly _viewportPipeline: ViewportPipeline;
};

/** Thin façade over boot-time group store; kept out of {@link wireImpastoEngineApis} for line-count limits. */
function buildColorPinGroupsApi(mid: ImpastoEngineBootMid): ImpastoEngineColorPinGroupsApi {
  return {
    getAll: () => mid._colorPinGroups.getAll(),
    subscribe: (listener) => mid._colorPinGroups.subscribe(listener),
    add: (label, color) => mid._colorPinGroups.add(label, color),
    removeById: (id) => mid._colorPinGroups.removeById(id),
    setLabel: (id, label) => mid._colorPinGroups.setLabel(id, label),
    setAllGroups: (groups) => mid._colorPinGroups.setAllGroups(groups),
  };
}

/**
 * Creates the pipeline, assigns {@link ImpastoEngineBootMid.pipelineRef} once (see file header), and returns it.
 * Split from {@link wireImpastoEngineApis} so that function stays within `max-lines-per-function`.
 */
function createAndAssignViewportPipeline(
  mid: ImpastoEngineBootMid,
  image: ImpastoEngineImageApi,
  colorPins: ImpastoEngineColorPinsApi,
): ViewportPipeline {
  const { ensureNotDisposed, viewportPipelineStateListeners, pipelineRef } = mid;

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

  return _viewportPipeline;
}

export function wireImpastoEngineApis(mid: ImpastoEngineBootMid): ImpastoEngineBootWiredApis {
  const { ensureNotDisposed, viewportPipelineStateListeners } = mid;

  const viewport = buildViewportApi({
    physics: mid._viewportPhysics,
    hub: mid._viewportHub,
    ensureLive: ensureNotDisposed,
    getImage: () => mid._sourceImageCoordinator.getImage(),
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

  const _viewportPipeline = createAndAssignViewportPipeline(mid, image, colorPins);

  const filters = buildEngineFiltersApi({
    ensureLive: ensureNotDisposed,
    pipeline: _viewportPipeline,
    history: mid._historyManager,
  });

  const palette = buildEnginePaletteApi({
    paletteSync: mid._paletteSync,
    resolved: mid._resolvedPalette,
    ensureLive: ensureNotDisposed,
  });

  const pipeline = buildPipelineApi({
    pipeline: _viewportPipeline,
    subscribeState: (listener) => viewportPipelineStateListeners.add(listener),
  });

  const viewports = buildViewportsApi(_viewportPipeline);

  const colorPinGroups = buildColorPinGroupsApi(mid);

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
    colorPinGroups,
    selection,
    marquee,
    filters,
    palette,
    pipeline,
    viewports,
    _viewportPipeline,
  };
}
