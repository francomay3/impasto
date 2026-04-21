import ImgPipelineWorker from '../../workers/img-pipeline.worker?worker';
import type { FilterWorkerOutput } from './filterChainWorkerProtocol';

type FilterWorkerCallbacks = {
  onResult: (out: FilterWorkerOutput) => void;
  onError: (e: ErrorEvent) => void;
};

/** Constructs the img-pipeline worker and wires typed message/error callbacks. */
export function createFilterWorker(callbacks: FilterWorkerCallbacks): Worker {
  const w = new ImgPipelineWorker();
  w.onmessage = (e: MessageEvent<FilterWorkerOutput>) => {
    callbacks.onResult(e.data);
  };
  w.onerror = (e) => {
    callbacks.onError(e);
  };
  return w;
}
