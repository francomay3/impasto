/**
 * Executes one filter pass for {@link FilterRunnerQueue}: no-worker fast paths,
 * cache-only output, or posting incremental work to the img-pipeline worker.
 *
 * **Invariants:** Synchronous branches (`!source`, empty filters, missing worker) call `patchState` and return
 * without touching `postMessage`. When a worker run starts, `markWorkerBusy` is invoked so the queue’s coalescer
 * can defer overlapping `scheduleFilterPass` calls until the async completion path runs.
 */

import type { FilterInstance, RawImage } from '../../../types';
import { createRawImage } from '../../../types';
import type { FilterInstance as WasmFilterInstance, FilterWorkerInput } from './filterChainWorkerProtocol';
import type { FilterChainImageDep, FilterChainRunnerState } from './filterChainRunnerTypes';
import type { FilterPassCache } from './filterPassCache';

function cloneRawImage(img: RawImage): RawImage {
  const copy = new Uint8ClampedArray(img.data);
  return createRawImage(copy, img.width, img.height);
}

type RunFilterPassHost = {
  imageDep: FilterChainImageDep;
  getFilters: () => FilterInstance[];
  getWorker: () => Worker | null;
  onFilteredOutput: (img: RawImage) => void;
  patchState: (patch: Partial<FilterChainRunnerState>) => void;
  passCache: FilterPassCache;
  markWorkerBusy: () => void;
};

export function runFilterPass(host: RunFilterPassHost): void {
  const source = host.imageDep.get();
  const currentFilters = host.getFilters();
  const w = host.getWorker();
  if (!source) {
    host.patchState({ status: 'idle', error: null });
    return;
  }

  if (currentFilters.length === 0) {
    host.onFilteredOutput(cloneRawImage(source));
    host.passCache.seed(source);
    host.patchState({ status: 'ready', error: null });
    return;
  }

  if (!w) {
    host.patchState({ status: 'error', error: 'Worker not initialized' });
    return;
  }

  const prev = host.passCache.getPrev();
  const dirtyIndex = host.passCache.computeDirtyIndex(prev, currentFilters);
  const filtersToApply = currentFilters.slice(dirtyIndex);

  if (filtersToApply.length === 0) {
    const cached = host.passCache.get(dirtyIndex);
    const out = cached
      ? createRawImage(new Uint8ClampedArray(cached), source.width, source.height)
      : cloneRawImage(source);
    host.onFilteredOutput(out);
    host.passCache.setPrevToCloned(currentFilters);
    host.patchState({ status: 'ready', error: null });
    return;
  }

  let start = host.passCache.get(dirtyIndex) ?? host.passCache.get(0);
  if (!start && dirtyIndex === 0) {
    start = new Uint8Array(source.data.buffer, source.data.byteOffset, source.data.byteLength);
  }
  if (!start) {
    host.patchState({ status: 'error', error: 'Missing filter cache' });
    return;
  }

  const pixelsCopy = new Uint8Array(start);
  host.markWorkerBusy();
  host.passCache.beginInflightChain(currentFilters);
  host.patchState({ status: 'filtering', error: null });
  const input: FilterWorkerInput = {
    pixels: pixelsCopy,
    width: source.width,
    height: source.height,
    // App `FilterInstance` keeps `params` as an uncorrelated union; runtime JSON matches WASM.
    filters: filtersToApply as unknown as WasmFilterInstance[],
    dirtyIndex,
  };
  w.postMessage(input, [pixelsCopy.buffer]);
}
