import type { FilterChainRunnerState } from './FilterChainRunner';
import type { IndexedPassRunnerState } from './IndexedPassRunner';
import type { ViewportPipelineState } from './viewportPipelineTypes';

/**
 * Merges filter-runner and index-runner snapshots plus blur σ into the single
 * {@link ViewportPipelineState} exposed by {@link ViewportPipeline}. Reuses `prev` when none of
 * the compared fields changed (stable reference for `useSyncExternalStore`).
 */
export function mergeRunnerStates(
  filter: FilterChainRunnerState,
  indexed: IndexedPassRunnerState,
  blurSigma: number,
  prev: ViewportPipelineState | null,
): ViewportPipelineState {
  if (
    prev &&
    prev.status === filter.status &&
    prev.error === filter.error &&
    prev.indexedStatus === indexed.indexedStatus &&
    prev.indexedError === indexed.indexedError &&
    prev.indexBlurSigma === blurSigma
  ) {
    return prev;
  }
  return {
    status: filter.status,
    error: filter.error,
    indexedStatus: indexed.indexedStatus,
    indexedError: indexed.indexedError,
    indexBlurSigma: blurSigma,
  };
}
