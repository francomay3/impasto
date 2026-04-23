/**
 * Per-filter-job queue: incremental {@link FilterPassCache}, coalesced scheduling
 * (`pendingRun` + `workerBusy`), and worker message handling for one source image.
 *
 * Invariants: {@link FilterChainRunner} owns the `Worker` instance (construction,
 * `postMessage`, `terminate`); this module only drives when to post and how to
 * interpret results. Filter snapshots are read via `getFilters` so the runner
 * remains the single owner of `_filters` and `setFilters` cloning. The heavy
 * `runFilterPass` body lives in {@link filterRunnerRunPass} to keep this file
 * within the line budget; see {@link runFilterPass}.
 */

import type { FilterInstance, RawImage } from '../../types';
import { createRawImage } from '../../types';
import type { FilterWorkerOutput } from './filterChainWorkerProtocol';
import type { FilterChainImageDep, FilterChainRunnerState } from './filterChainRunnerTypes';
import { FilterPassCache } from './filterPassCache';
import { runFilterPass } from './filterRunnerRunPass';

type FilterChainStateListener = (state: FilterChainRunnerState) => void;

type FilterRunnerQueueDeps = {
  imageDep: FilterChainImageDep;
  getFilters: () => FilterInstance[];
  onFilteredOutput: (img: RawImage) => void;
  onStateChange?: FilterChainStateListener;
  getWorker: () => Worker | null;
};

/** Queue + state machine slice extracted from {@link FilterChainRunner}. */
export class FilterRunnerQueue {
  private readonly imageDep: FilterChainImageDep;
  private readonly getFilters: () => FilterInstance[];
  private readonly onFilteredOutput: (img: RawImage) => void;
  private readonly onStateChange: FilterChainStateListener | undefined;
  private readonly getWorker: () => Worker | null;

  private _state: FilterChainRunnerState = {
    status: 'idle',
    error: null,
  };

  private workerBusy = false;
  private pendingRun = false;
  private readonly passCache = new FilterPassCache();

  constructor(deps: FilterRunnerQueueDeps) {
    this.imageDep = deps.imageDep;
    this.getFilters = deps.getFilters;
    this.onFilteredOutput = deps.onFilteredOutput;
    this.onStateChange = deps.onStateChange;
    this.getWorker = deps.getWorker;
  }

  getState(): FilterChainRunnerState {
    return this._state;
  }

  /**
   * Re-seed incremental cache from {@link FilterChainImageDep} and schedule a pass
   * (or emit idle + blank output when there is no source).
   */
  syncFromImageDep(): void {
    const img = this.imageDep.get();
    if (!img) {
      this.passCache.clear();
      this.patchState({ status: 'idle', error: null });
      this.onFilteredOutput(createRawImage(new Uint8ClampedArray([0, 0, 0, 0]), 1, 1));
      return;
    }
    this.passCache.seed(img);
    this.patchState({ status: 'ready', error: null });
    this.scheduleFilterPass();
  }

  /** Called when the filter chain changes and a pass may be needed. */
  scheduleFilterPass(): void {
    this.pendingRun = true;
    if (this.workerBusy) return;
    this.pendingRun = false;
    this.dispatchFilterPass();
  }

  handleWorkerResult(out: FilterWorkerOutput): void {
    const { steps, dirtyIndex } = out;
    const source = this.imageDep.get();
    // Both `beginInflightChain` and `setPrevToCloned` snapshot the enabled-only projection,
    // so staleness and cache-length accounting here must also use the enabled projection —
    // otherwise a disabled filter in the raw `_filters` list would mismatch the inflight
    // snapshot and (incorrectly) trigger the stale branch on every completion.
    const enabledFilters = this.getFilters().filter((f) => f.enabled !== false);
    if (!this.passCache.inflightMatches(enabledFilters) || !source) {
      // Stale result (chain changed mid-flight) or source gone. Discard and, if the chain
      // did move forward, force a re-dispatch so the latest chain always reaches the worker.
      this.workerBusy = false;
      if (source && !this.passCache.inflightMatches(enabledFilters)) {
        this.pendingRun = true;
      }
      this.pumpFilterQueue();
      return;
    }

    if (steps.length === 0) {
      this.patchState({ status: 'error', error: 'Empty worker result' });
      this.workerBusy = false;
      this.pumpFilterQueue();
      return;
    }

    this.passCache.update(dirtyIndex, steps, enabledFilters.length);

    const last = steps[steps.length - 1];
    const rgba = new Uint8ClampedArray(last);
    this.onFilteredOutput(createRawImage(rgba, source.width, source.height));

    this.passCache.commitInflightToPrev();
    this.patchState({ status: 'ready', error: null });
    this.workerBusy = false;
    this.pumpFilterQueue();
  }

  handleWorkerError(e: ErrorEvent): void {
    console.error('[FilterChainRunner img_pipeline worker]', e);
    this.patchState({ status: 'error', error: e.message || 'Worker error' });
    this.workerBusy = false;
    this.pumpFilterQueue();
  }

  /** Clear queue flags and incremental cache after the worker is terminated. */
  resetAfterDispose(): void {
    this.workerBusy = false;
    this.pendingRun = false;
    this.passCache.clear();
  }

  private patchState(patch: Partial<FilterChainRunnerState>): void {
    this._state = { ...this._state, ...patch };
    this.onStateChange?.(this._state);
  }

  private pumpFilterQueue(): void {
    if (this.pendingRun) {
      this.pendingRun = false;
      this.dispatchFilterPass();
    }
  }

  private dispatchFilterPass(): void {
    runFilterPass({
      imageDep: this.imageDep,
      getFilters: this.getFilters,
      getWorker: this.getWorker,
      onFilteredOutput: this.onFilteredOutput,
      patchState: (p) => this.patchState(p),
      passCache: this.passCache,
      markWorkerBusy: () => {
        this.workerBusy = true;
      },
    });
  }
}
