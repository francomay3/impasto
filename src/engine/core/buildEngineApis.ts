/**
 * Thin wiring layer for the engine’s grouped public API surface (`ImpastoEngineApi` types).
 *
 * Each factory here returns a plain object of delegates: no history pushes, no filter/image equality,
 * no pointer/modifier interpretation, and no coordinate transforms beyond forwarding to the injected subsystem.
 * Anything that needs composition-root behaviour (dispose guards, document pipeline state subscription, or
 * `pickColorPin`’s selection-domain helpers) is passed in via typed `deps` so this module stays a pure façade.
 *
 * `filters` is intentionally omitted: history-aware filter wiring lives in {@link buildEngineFiltersApi}
 * (`core/buildEngineFiltersApi.ts`), not in this pure-delegation façade.
 */

import type { HistoryManager } from '../history/HistoryManager';
import { nudgeSampleColorBrushByHotkey } from '../input/engineHotkeyActions';
import type { InputManager } from '../input/InputManager';
import type { ViewportPipeline, ViewportPipelineState } from '../pipeline/ViewportPipeline';
import type { MarqueeGestureState } from '../selection/MarqueeGestureState';
import type { SelectionState } from '../selection/SelectionState';
import type { ToolState } from '../tools/ToolState';
import { fitToContain } from '../viewport/fitToContain';
import type { ViewportHub } from '../viewport/viewportHub';
import type { ViewportPhysics } from '../viewport/ViewportPhysics';
import type { RawImage } from '../../types';
import type {
  ImpastoEngineManagersApi,
  ImpastoEngineMarqueeApi,
  ImpastoEnginePipelineApi,
  ImpastoEngineSelectionApi,
  ImpastoEngineToolsApi,
  ImpastoEngineViewports,
  ImpastoEngineViewportApi,
} from './ImpastoEngineApi';

/** Subsystems and hooks needed to expose {@link ImpastoEngineViewportApi}. */
type BuildViewportApiDeps = {
  readonly physics: ViewportPhysics;
  readonly hub: ViewportHub;
  /** Called before mutating transform state from the public API (matches disposed-engine guard on `setTransform`). */
  readonly ensureLive: () => void;
  readonly getImage: () => RawImage | null;
};

export function buildViewportApi(deps: BuildViewportApiDeps): ImpastoEngineViewportApi {
  return {
    physics: deps.physics,
    subscribe: (viewport) => deps.hub.subscribe(viewport),
    subscribeTransform: (listener) => deps.hub.subscribeTransform(listener),
    setTransform: (next) => {
      deps.ensureLive();
      deps.hub.setTransform(next);
    },
    requestTransform: (next) => deps.hub.requestTransform(next),
    setViewportSize: (width, height) => {
      deps.ensureLive();
      deps.hub.setViewportSize(width, height);
    },
    getViewportSize: () => deps.hub.getViewportSize(),
    fitToImage: () => {
      const image = deps.getImage();
      const size = deps.hub.getViewportSize();
      if (!image || !size || size.width <= 0 || size.height <= 0) {
        return false;
      }
      deps.hub.requestTransform(fitToContain(image.width, image.height, size.width, size.height));
      return true;
    },
  };
}

export function buildManagersApi(input: InputManager, history: HistoryManager): ImpastoEngineManagersApi {
  return {
    input,
    history,
  };
}

/** Subsystems and hooks for {@link ImpastoEngineToolsApi}. */
type BuildToolsApiDeps = {
  readonly tools: ToolState;
  readonly ensureLive: () => void;
};

export function buildToolsApi(deps: BuildToolsApiDeps): ImpastoEngineToolsApi {
  return {
    getState: () => deps.tools.getState(),
    subscribe: (listener) => deps.tools.subscribe(listener),
    setActiveTool: (tool) => {
      deps.ensureLive();
      deps.tools.setActiveTool(tool);
    },
    setToolParamValue: (tool, paramKey, value) => deps.tools.setToolParamValue(tool, paramKey, value),
    nudgeSampleColorBrush: (deltaSteps) => {
      deps.ensureLive();
      nudgeSampleColorBrushByHotkey(deps.tools, deltaSteps);
    },
  };
}

/**
 * Selection list façade. `pickColorPin` is supplied by the composition root because it chains
 * `colorPinPointerSelection` helpers; this factory only binds the object shape.
 */
type BuildSelectionApiDeps = {
  readonly selection: SelectionState;
  readonly pickColorPin: ImpastoEngineSelectionApi['pickColorPin'];
};

export function buildSelectionApi(deps: BuildSelectionApiDeps): ImpastoEngineSelectionApi {
  return {
    getAll: () => deps.selection.getAll(),
    set: (next) => deps.selection.set(next),
    clear: () => deps.selection.clear(),
    subscribe: (listener) => deps.selection.subscribe(listener),
    pickColorPin: deps.pickColorPin,
  };
}

export function buildMarqueeApi(gesture: MarqueeGestureState): ImpastoEngineMarqueeApi {
  return {
    getDraft: () => gesture.getDraft(),
    subscribe: (listener) => gesture.subscribe(listener),
  };
}

/** Pipeline façade; `subscribe` fans out engine-owned pipeline-state listeners. */
type BuildPipelineApiDeps = {
  readonly pipeline: ViewportPipeline;
  readonly subscribeState: (listener: (state: ViewportPipelineState) => void) => () => void;
};

export function buildPipelineApi(deps: BuildPipelineApiDeps): ImpastoEnginePipelineApi {
  return {
    getState: () => deps.pipeline.getState(),
    subscribe: (listener) => deps.subscribeState(listener),
    getIndexConfig: () => deps.pipeline.getIndexConfig(),
    setIndexConfig: (config) => deps.pipeline.setIndexConfig(config),
  };
}

export function buildViewportsApi(pipeline: ViewportPipeline): ImpastoEngineViewports {
  return {
    source: pipeline.getSourceViewport(),
    filtered: pipeline.getFilteredViewport(),
    indexed: pipeline.getIndexedViewport(),
  };
}
