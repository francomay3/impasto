import type { RawImage } from '../../../types';
import { createRawImage } from '../../../types';

/** Source bitmap the pipeline reads for source/filtered/indexed passes (no `set`; writers live on the engine). */
export type PipelineImageDep = {
  get(): RawImage | null;
  subscribe(l: () => void): () => void;
};

export type ViewportPipelineState = {
  status: 'idle' | 'filtering' | 'ready' | 'error';
  error: string | null;
  /** Palette index pass (`img-index.worker`). Stays `idle` when the palette is empty (no colors on the engine yet). */
  indexedStatus: 'idle' | 'indexing' | 'ready' | 'error';
  indexedError: string | null;
  /** Gaussian σ for WASM blur on the filtered bitmap immediately before palette remap (not shown on the filtered viewport). */
  indexBlurSigma: number;
};

export type StateListener = (state: ViewportPipelineState) => void;

export function blankImage(): RawImage {
  return createRawImage(new Uint8ClampedArray([0, 0, 0, 0]), 1, 1);
}
