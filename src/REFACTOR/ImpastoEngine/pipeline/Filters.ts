import type { FilterInstance, RawImage } from '../../../types';
import {
  FilterChainRunner,
  type FilterChainImageDep,
  type FilterChainRunnerState,
} from './FilterChainRunner';

/**
 * WASM filter chain for the engine source image. Owns {@link FilterChainRunner};
 * composed by {@link ViewportPipeline} and exposed as {@link ImpastoEngine.filters}.
 */
export class Filters {
  private readonly runner: FilterChainRunner;

  constructor(
    imageDep: FilterChainImageDep,
    onFilteredOutput: (img: RawImage) => void,
    onFilterWorkerStateChanged?: () => void,
  ) {
    this.runner = new FilterChainRunner(
      imageDep,
      onFilteredOutput,
      onFilterWorkerStateChanged,
    );
  }

  getFilters(): FilterInstance[] {
    return this.runner.getFilters();
  }

  setFilters(next: FilterInstance[]): void {
    this.runner.setFilters(next);
  }

  /** Fires when the canonical filter list changes ({@link setFilters}). */
  subscribe(listener: () => void): () => void {
    return this.runner.subscribeFilters(listener);
  }

  /** Filter-worker slice merged into {@link ViewportPipelineState} by the pipeline. */
  getState(): FilterChainRunnerState {
    return this.runner.getState();
  }

  syncFromImageDep(): void {
    this.runner.syncFromImageDep();
  }

  dispose(): void {
    this.runner.dispose();
  }
}
