/**
 * Shared types for {@link FilterChainRunner} and {@link FilterRunnerQueue} so the
 * queue module does not import the runner (avoids a circular dependency).
 *
 * **Invariants:** Type-only module — no runtime values. `FilterChainImageDep` mirrors the pipeline’s read-only
 * image façade (`get` + `subscribe`). `FilterChainRunnerState` is the minimal status/error slice merged into
 * broader viewport pipeline state elsewhere.
 */

import type { RawImage } from '../../../types';

/** Source image for the filter worker; same contract as future {@link PipelineImageDep} on the pipeline. */
export type FilterChainImageDep = {
  get(): RawImage | null;
  subscribe(l: () => void): () => void;
};

/** Filter-worker slice of pipeline state (merged into {@link ViewportPipelineState} at the pipeline level). */
export type FilterChainRunnerState = {
  status: 'idle' | 'filtering' | 'ready' | 'error';
  error: string | null;
};
