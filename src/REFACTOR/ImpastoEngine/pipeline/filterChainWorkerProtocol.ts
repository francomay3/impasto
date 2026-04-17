/**
 * WASM/worker JSON shape for one pipeline step (`{ type, params }`). Generated from Rust; UI
 * {@link import('../../../types').FilterInstance} also carries `id` / `enabled`, which serde ignores.
 */
export type { FilterInstance } from '../../../wasm/generated/FilterInstance';
import type { FilterInstance } from '../../../wasm/generated/FilterInstance';

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
