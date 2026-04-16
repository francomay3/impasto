/**
 * Worker-backed filter chain runner: owns the `Worker` instance, filter list snapshots, and subscription fan-out.
 *
 * **Invariants:** `_filters` is the single mutable source of truth for the chain passed to the worker; `setFilters`
 * clones on write so external callers cannot mutate internal snapshots. The {@link FilterRunnerQueue} never
 * constructs or terminates the worker — it only receives `getWorker` and posts when the worker is non-null.
 *
 * **Coupling:** Implements the image side of the viewport pipeline via `FilterChainImageDep`; re-exports shared
 * types from {@link filterChainRunnerTypes} so consumers avoid importing the queue module for types alone.
 */
import type { FilterInstance, RawImage } from '../../../types';
import { createFilterWorker } from './filterWorkerBridge';
import type { FilterChainImageDep, FilterChainRunnerState } from './filterChainRunnerTypes';
import { FilterRunnerQueue } from './filterRunnerQueue';

export type { FilterChainImageDep, FilterChainRunnerState } from './filterChainRunnerTypes';

type FilterChainStateListener = (state: FilterChainRunnerState) => void;

function cloneFilterList(filters: FilterInstance[]): FilterInstance[] {
  return structuredClone(filters);
}

/**
 * Runs the img-pipeline worker chain for a single source image dependency.
 *
 * Owns worker lifecycle, filter list snapshots, and UI subscription for filter
 * changes. Queue pumping, incremental cache, and worker result handling live in
 * {@link FilterRunnerQueue}.
 */
export class FilterChainRunner {
  private _filters: FilterInstance[] = [];
  private readonly filterListeners = new Set<() => void>();

  private worker: Worker | null = null;
  private readonly queue: FilterRunnerQueue;

  constructor(
    imageDep: FilterChainImageDep,
    onFilteredOutput: (img: RawImage) => void,
    onStateChange?: FilterChainStateListener,
  ) {
    this.queue = new FilterRunnerQueue({
      imageDep,
      getFilters: () => this._filters,
      onFilteredOutput,
      onStateChange,
      getWorker: () => this.worker,
    });
    this.worker = createFilterWorker({
      onResult: (out) => this.queue.handleWorkerResult(out),
      onError: (e) => this.queue.handleWorkerError(e),
    });
  }

  /** Filter-worker slice; combined into {@link ViewportPipelineState} by {@link ViewportPipeline}. */
  getState(): FilterChainRunnerState {
    return this.queue.getState();
  }

  getFilters(): FilterInstance[] {
    return this._filters;
  }

  setFilters(next: FilterInstance[]): void {
    this._filters = cloneFilterList(next);
    this.emitFiltersChange();
    this.queue.scheduleFilterPass();
  }

  /** Subscribe to changes from {@link FilterChainRunner.setFilters} (canonical chain for UI + worker). */
  subscribeFilters(listener: () => void): () => void {
    this.filterListeners.add(listener);
    return () => {
      this.filterListeners.delete(listener);
    };
  }

  dispose(): void {
    this.filterListeners.clear();
    this.worker?.terminate();
    this.worker = null;
    this.queue.resetAfterDispose();
  }

  /**
   * Re-seed incremental cache from the runner's image dependency and schedule a pass (or emit idle + blank output when there is no source).
   * Call from the pipeline when the engine source image changes.
   */
  syncFromImageDep(): void {
    this.queue.syncFromImageDep();
  }

  private emitFiltersChange(): void {
    for (const listener of this.filterListeners) {
      listener();
    }
  }
}
