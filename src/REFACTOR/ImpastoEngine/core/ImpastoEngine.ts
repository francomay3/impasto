/**
 * Composition root for the refactored Impasto engine: owns lifecycle, document I/O, and dispose wiring.
 *
 * **Invariants:** Subsystem construction and public API façades are delegated to {@link createImpastoEngineBoot}
 * so this class stays within `project-check` limits. `dispose` flips a shared {@link ImpastoEngineLifecycle} flag
 * consumed by palette sync and coordinator paths. `loadDocument` applies snapshots in a fixed order (filters,
 * pins, source image, drag abort) so history and transient pointer state cannot diverge.
 *
 * **Coupling:** Imports concrete subsystems only for field types and `dispose`/`loadDocument`; behavioural
 * wiring lives under `core/createImpastoEngineBoot.ts` and related boot modules.
 */
import type { RawImage } from '../../../types';
import { ColorPinPointerDragSession } from '../colorPins/ColorPinPointerDragSession';
import { ColorPinState } from '../colorPins/ColorPinState';
import { MarqueeGestureState } from '../selection/MarqueeGestureState';
import { HistoryManager } from '../history/HistoryManager';
import { InputManager } from '../input/InputManager';
import { ViewportPipeline } from '../pipeline/ViewportPipeline';
import type { ImpastoDocumentSnapshot } from './impastoDocumentSnapshot';
import type {
  ImpastoEngineColorPinsApi,
  ImpastoEngineDocumentApi,
  ImpastoEngineFiltersApi,
  ImpastoEngineImageApi,
  ImpastoEngineManagersApi,
  ImpastoEnginePipelineApi,
  ImpastoEngineSelectionApi,
  ImpastoEngineToolsApi,
  ImpastoEngineViewports,
  ImpastoEngineMarqueeApi,
  ImpastoEngineViewportApi,
} from './ImpastoEngineApi';
import { ColorPinCoordinator } from '../colorPins/ColorPinCoordinator';
import { cloneColorPinSnapshot } from './colorPinHistorySnapshot';
import { cloneFilterSnapshot } from './filterHistorySnapshot';
import { SourceImageCoordinator } from './SourceImageCoordinator';
import { applyEngineFilterSnapshot } from './buildEngineFiltersApi';
import { createImpastoEngineBoot, type ImpastoEngineLifecycle } from './createImpastoEngineBoot';

/**
 * Application-level engine for Impasto (orchestration above feature-local engines such as the canvas `CanvasEngine`).
 *
 * Public API is grouped for IntelliSense: {@link viewport}, {@link viewports}, {@link image},
 * {@link filters}, {@link pipeline}, {@link tools}, `marquee`, {@link managers}. Document snapshot
 * methods implement {@link ImpastoEngineDocumentApi}.
 */
export class ImpastoEngine implements ImpastoEngineDocumentApi {
  private readonly _lifecycle: ImpastoEngineLifecycle = { disposed: false };
  private readonly _inputManager: InputManager;
  private readonly _historyManager: HistoryManager;
  private readonly _colorPinDragSession: ColorPinPointerDragSession;
  private readonly _colorPins: ColorPinState;
  private readonly _colorPinCoordinator: ColorPinCoordinator;
  private readonly _marqueeGesture: MarqueeGestureState;
  private readonly _sourceImageCoordinator: SourceImageCoordinator;
  private readonly _viewportPipeline: ViewportPipeline;
  private readonly _unsubscribeColorPins: () => void;

  readonly viewport: ImpastoEngineViewportApi;
  readonly image: ImpastoEngineImageApi;
  readonly filters: ImpastoEngineFiltersApi;
  readonly pipeline: ImpastoEnginePipelineApi;
  readonly tools: ImpastoEngineToolsApi;
  readonly colorPins: ImpastoEngineColorPinsApi;
  readonly selection: ImpastoEngineSelectionApi;
  readonly managers: ImpastoEngineManagersApi;
  readonly marquee: ImpastoEngineMarqueeApi;
  readonly viewports: ImpastoEngineViewports;

  constructor() {
    const b = createImpastoEngineBoot({ lifecycle: this._lifecycle });
    this._inputManager = b._inputManager;
    this._historyManager = b._historyManager;
    this._colorPinDragSession = b._colorPinDragSession;
    this._colorPins = b._colorPins;
    this._colorPinCoordinator = b._colorPinCoordinator;
    this._marqueeGesture = b._marqueeGesture;
    this._sourceImageCoordinator = b._sourceImageCoordinator;
    this._viewportPipeline = b._viewportPipeline;
    this._unsubscribeColorPins = b._unsubscribeColorPins;
    this.viewport = b.viewport;
    this.image = b.image;
    this.managers = b.managers;
    this.tools = b.tools;
    this.colorPins = b.colorPins;
    this.selection = b.selection;
    this.marquee = b.marquee;
    this.filters = b.filters;
    this.pipeline = b.pipeline;
    this.viewports = b.viewports;
  }

  getDocumentSnapshot(): ImpastoDocumentSnapshot {
    this.ensureNotDisposed();
    const pins = Object.freeze([...cloneColorPinSnapshot(this._colorPins.getAll())]);
    const filters = Object.freeze(cloneFilterSnapshot(this._viewportPipeline.filters.getFilters()));
    const indexConfig = Object.freeze({ ...this._viewportPipeline.getIndexConfig() });
    return Object.freeze({ pins, filters, indexConfig });
  }

  subscribeDocumentChanged(listener: () => void): () => void {
    this.ensureNotDisposed();
    return this._historyManager.subscribe(listener);
  }

  loadDocument(snapshot: ImpastoDocumentSnapshot, sourceImage?: RawImage | null): void {
    this.ensureNotDisposed();
    this._colorPinCoordinator.abortDrag();
    this._colorPinCoordinator.loadSnapshot(snapshot.pins);
    applyEngineFilterSnapshot(
      { ensureLive: () => this.ensureNotDisposed(), pipeline: this._viewportPipeline },
      cloneFilterSnapshot(snapshot.filters),
    );
    this._viewportPipeline.setIndexConfig({ ...snapshot.indexConfig });
    if (sourceImage !== undefined) {
      this._sourceImageCoordinator.applySnapshot(sourceImage);
    }
    this._historyManager.clearSilently();
  }

  dispose(): void {
    if (this._lifecycle.disposed) {
      return;
    }
    this._lifecycle.disposed = true;
    this._colorPinDragSession.clear();
    this._historyManager.clear();
    this._marqueeGesture.clear();
    this._inputManager.detach();
    this._unsubscribeColorPins();
    this._viewportPipeline.dispose();
  }

  private ensureNotDisposed(): void {
    if (this._lifecycle.disposed) {
      throw new Error('ImpastoEngine: used after dispose');
    }
  }

}
