/**
 * Tunables for the index worker (`img-index`): blur on the filtered bitmap applied only inside WASM * before palette remap. Does not affect the filtered viewport.
 *
 * Aligned with legacy `ProjectState.preIndexingBlur` (Gaussian σ, not CSS `blur()` radius).
 * Default σ lives in {@link import('../infra/engineConstants').DEFAULT_INDEX_BLUR_SIGMA}.
 */

export type PipelineIndexConfig = {
  blurSigma: number;
};
