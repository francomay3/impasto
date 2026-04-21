import type { RawImage } from '../../types';
import { Filters } from './Filters';
import { IndexedPassRunner } from './IndexedPassRunner';
import type { Viewport } from '../viewport/Viewport';
import { ViewportPhysics } from '../viewport/ViewportPhysics';
import type { ViewportCanvasInputHost } from '../viewports/canvas/host/viewportInputPolicy';
import { FilteredViewportCanvas } from '../viewports/canvas/surfaces/FilteredViewportCanvas';
import { IndexedViewportCanvas } from '../viewports/canvas/surfaces/IndexedViewportCanvas';
import { SourceViewportCanvas } from '../viewports/canvas/surfaces/SourceViewportCanvas';
import type { PipelineIndexConfig } from './pipelineIndexConfig';
import type { IndexedPassRunnerPaletteConfig } from './IndexedPassRunner';
import {
  blankImage,
  type PipelineImageDep,
  type StateListener,
  type ViewportPipelineState,
} from './viewportPipelineTypes';
import { mergeRunnerStates } from './viewportPipelineMerger';

export type {  ViewportPipelineState } from './viewportPipelineTypes';


/**
 * Orchestrates {@link Filters}, indexed pass, and three surface viewports ({@link SourceViewportCanvas},
 * {@link FilteredViewportCanvas}, {@link IndexedViewportCanvas}). Constructed by {@link ImpastoEngine}
 * with {@link PipelineImageDep} + shared {@link ViewportPhysics}. The canonical filter list is
 * {@link ViewportPipeline.filters}. Indexed output: filtered RGBA → `img-index` with pre-index blur σ + LAB palette.
 * Palette rows are derived from geometry-only color pins on the engine (not stored on pins).
 */
export class ViewportPipeline {
  private readonly imageDep: PipelineImageDep;
  private readonly onStateChange: StateListener | undefined;
  private readonly sourceViewport: SourceViewportCanvas;
  private readonly filteredViewport: FilteredViewportCanvas;
  private readonly indexedViewport: IndexedViewportCanvas;
  private readonly unsubscribeSource: () => void;
  private readonly unsubscribeFiltered: () => void;
  private readonly unsubscribeIndexed: () => void;
  private readonly unsubscribeSourceImage: () => void;

  /** Filter chain + img-pipeline worker; {@link ImpastoEngine.filters} delegates here. */
  readonly filters: Filters;
  private readonly indexedPassRunner: IndexedPassRunner;

  /** Stable reference for {@link getState} / `useSyncExternalStore` when runner fields are unchanged. */
  private mergedStateCache: ViewportPipelineState | null = null;

  constructor(
    imageDep: PipelineImageDep,
    viewportPhysics: ViewportPhysics,
    viewportSubscribe: (viewport: Viewport) => () => void,
    onStateChange: StateListener | undefined,
    canvasInputHost: ViewportCanvasInputHost,
    /** Fires after filtered output is applied to the filtered viewport and index runner (for palette rebuild). */
    onFilteredImageOutput?: (img: RawImage) => void,
  ) {
    this.imageDep = imageDep;
    this.onStateChange = onStateChange;
    this.sourceViewport = new SourceViewportCanvas(viewportPhysics, canvasInputHost);
    this.filteredViewport = new FilteredViewportCanvas(viewportPhysics, canvasInputHost);
    this.indexedViewport = new IndexedViewportCanvas(viewportPhysics, canvasInputHost);
    this.unsubscribeSource = viewportSubscribe(this.sourceViewport);
    this.unsubscribeFiltered = viewportSubscribe(this.filteredViewport);
    this.unsubscribeIndexed = viewportSubscribe(this.indexedViewport);

    this.indexedPassRunner = new IndexedPassRunner(
      (img) => this.indexedViewport.setImage(img),
      () => this.notifyPipelineState(),
    );

    this.filters = new Filters(
      this.imageDep,
      (img) => {
        this.filteredViewport.setImage(img);
        if (onFilteredImageOutput) {
          this.indexedPassRunner.setLastFilteredImageOnly(img);
          onFilteredImageOutput(img);
        } else {
          this.indexedPassRunner.setFilteredImage(img);
        }
      },
      () => this.notifyPipelineState(),
    );

    this.unsubscribeSourceImage = imageDep.subscribe(() => {
      this.applySourceImageToPipeline();
    });
    this.applySourceImageToPipeline();
  }

  getSourceViewport(): SourceViewportCanvas {
    return this.sourceViewport;
  }

  getFilteredViewport(): FilteredViewportCanvas {
    return this.filteredViewport;
  }

  getIndexedViewport(): IndexedViewportCanvas {
    return this.indexedViewport;
  }

  /** Same reference the index worker uses; for deriving LAB from pins without reading the DOM. */
  getLastFilteredImage(): RawImage | null {
    return this.indexedPassRunner.getLastFilteredImage();
  }

  getSourceImage(): RawImage | null {
    return this.imageDep.get();
  }

  /** Merges {@link Filters.getState} and {@link IndexedPassRunner.getState} (single observable snapshot). */
  getState(): ViewportPipelineState {
    this.mergedStateCache = mergeRunnerStates(
      this.filters.getState(),
      this.indexedPassRunner.getState(),
      this.indexedPassRunner.getIndexBlurSigma(),
      this.mergedStateCache,
    );
    return this.mergedStateCache;
  }

  /**
   * LAB palette for `img-index`. Blur is {@link getIndexConfig} / {@link setIndexConfig}.
   * Empty palette: indexed viewport is cleared, no worker runs (`indexedStatus` → `idle`).
   */
  setIndexedPaletteConfig(config: IndexedPassRunnerPaletteConfig): void {
    this.indexedPassRunner.setIndexedPaletteConfig(config);
  }

  getIndexConfig(): Readonly<PipelineIndexConfig> {
    return { blurSigma: this.indexedPassRunner.getIndexBlurSigma() };
  }

  /** Partial merge: only supplied fields are applied. */
  setIndexConfig(config: Partial<PipelineIndexConfig>): void {
    if (config.blurSigma !== undefined) {
      this.indexedPassRunner.setIndexBlurSigma(config.blurSigma);
    }
  }

  dispose(): void {
    this.mergedStateCache = null;
    this.filters.dispose();
    this.indexedPassRunner.dispose();
    this.unsubscribeSourceImage();
    this.unsubscribeSource();
    this.unsubscribeFiltered();
    this.unsubscribeIndexed();
    this.sourceViewport.dispose();
    this.filteredViewport.dispose();
    this.indexedViewport.dispose();
  }

  private applySourceImageToPipeline(): void {
    const img = this.imageDep.get();
    if (!img) {
      const blank = blankImage();
      this.sourceViewport.setImage(blank);
      this.filters.syncFromImageDep();
      this.indexedPassRunner.clearIndexedToIdle();
      return;
    }

    this.sourceViewport.setImage(img);
    this.filters.syncFromImageDep();
  }

  private notifyPipelineState(): void {
    this.mergedStateCache = mergeRunnerStates(
      this.filters.getState(),
      this.indexedPassRunner.getState(),
      this.indexedPassRunner.getIndexBlurSigma(),
      this.mergedStateCache,
    );
    this.onStateChange?.(this.mergedStateCache);
  }
}
