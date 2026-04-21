/**
 * Factory for {@link ViewportPipeline} so the composition root does not embed a long `new ViewportPipeline(...)`
 * argument list. All parameters are callbacks or façade objects that cross domain boundaries (image pixels,
 * viewport hub, tool/input host, pipeline state fan-out).
 */

import type { RawImage } from '../../types';
import { ViewportPipeline } from '../pipeline/ViewportPipeline';
import type { PipelineImageDep, StateListener } from '../pipeline/viewportPipelineTypes';
import type { Viewport } from '../viewport/Viewport';
import type { ViewportPhysics } from '../viewport/ViewportPhysics';
import type { ViewportCanvasInputHost } from '../viewports/canvas/host/viewportInputPolicy';

/**
 * Cross-domain wiring passed from {@link ImpastoEngine} into {@link ViewportPipeline}.
 *
 * - **`imageDep`**: Read path for source bitmaps; implemented by {@link SourceImageCoordinator}'s public image API
 *   (`get` / `subscribe`). The pipeline must not own image history — only read + react to changes.
 * - **`viewportPhysics`**: Shared pan/zoom state for source/filtered/indexed surfaces; owned by the engine's
 *   viewport subsystem, injected so the pipeline can construct canvases without importing the hub.
 * - **`viewportSubscribe`**: Typically `ViewportHub.subscribe` — registers each surface with the hub so disposal
 *   tears down the right listener set (hub ↔ pipeline lifecycle coupling stays at the engine).
 * - **`onStateChange`**: Merged filter + index runner snapshot; the engine forwards this into its own
 *   `ListenerRegistry` for `useSyncExternalStore` / dev tooling — the pipeline stays unaware of React.
 * - **`canvasInputHost`**: Tool state + selection/marquee/sample-color behaviour invoked from pointer routing inside
 *   viewports. Lives as an engine-implemented object so `viewports/canvas` never imports `ImpastoEngine` or
 *   `SelectionState` directly.
 * - **`onFilteredImageOutput`**: Optional palette sync after filtered pixels land (pins → LAB rows). Engine wires
 *   {@link EnginePaletteSync} here so color-pin domain stays out of `pipeline/ViewportPipeline.ts`.
 */
type ViewportPipelineDeps = {
  readonly imageDep: PipelineImageDep;
  readonly viewportPhysics: ViewportPhysics;
  readonly viewportSubscribe: (viewport: Viewport) => () => void;
  readonly onStateChange: StateListener | undefined;
  readonly canvasInputHost: ViewportCanvasInputHost;
  readonly onFilteredImageOutput?: (img: RawImage) => void;
};

export function createViewportPipeline(deps: ViewportPipelineDeps): ViewportPipeline {
  return new ViewportPipeline(
    deps.imageDep,
    deps.viewportPhysics,
    deps.viewportSubscribe,
    deps.onStateChange,
    deps.canvasInputHost,
    deps.onFilteredImageOutput,
  );
}
