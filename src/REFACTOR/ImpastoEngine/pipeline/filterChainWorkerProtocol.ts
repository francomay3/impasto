import type { FilterInstance } from '../../../types';

/** Message shape posted to `img-pipeline.worker` from {@link FilterChainRunner}. */
export interface FilterWorkerInput {
  pixels: Uint8Array;
  width: number;
  height: number;
  filters: FilterInstance[];
  dirtyIndex: number;
}

/** Message shape received from `img-pipeline.worker` in {@link FilterChainRunner}. */
export interface FilterWorkerOutput {
  steps: ArrayBuffer[];
  dirtyIndex: number;
}
