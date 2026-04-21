import ImgIndexWorker from '../../workers/img-index.worker?worker';
import { createRawImage, type RawImage } from '../../types';
import type { IndexedPassWorkerInput, IndexedPassWorkerOutput } from './indexedPassWorkerProtocol';

type IndexedPassWorkerBridgeCallbacks = {
  onOutput: (indexed: RawImage, coverageCounts: number[]) => void;
  onError: (msg: string) => void;
  onSettled: () => void;
};

/**
 * Owns the `img-index` worker lifecycle and maps worker messages into {@link RawImage} + optional coverage metadata.
 *
 * The WASM worker currently posts only `{ buffer }`; coverage counts default to an empty array until the worker
 * protocol grows a native histogram pass.
 */
export class IndexedPassWorkerBridge {
  private readonly worker: Worker;
  private readonly callbacks: IndexedPassWorkerBridgeCallbacks;
  private pendingDims: { width: number; height: number } | null = null;

  constructor(callbacks: IndexedPassWorkerBridgeCallbacks) {
    this.callbacks = callbacks;
    this.worker = new ImgIndexWorker();
    this.worker.onmessage = (e: MessageEvent<Partial<IndexedPassWorkerOutput>>) => {
      const dims = this.pendingDims;
      this.pendingDims = null;
      if (!dims) {
        this.callbacks.onSettled();
        return;
      }
      const buf = e.data.buffer;
      if (!(buf instanceof ArrayBuffer)) {
        this.callbacks.onError('index worker: missing ArrayBuffer payload');
        this.callbacks.onSettled();
        return;
      }
      const u8 = new Uint8ClampedArray(buf);
      const indexed = createRawImage(u8, dims.width, dims.height);
      const coverageCounts = Array.isArray(e.data.coverageCounts) ? e.data.coverageCounts : [];
      this.callbacks.onOutput(indexed, coverageCounts);
      this.callbacks.onSettled();
    };
    this.worker.onerror = (err) => {
      this.pendingDims = null;
      this.callbacks.onError(err.message || 'index worker error');
      this.callbacks.onSettled();
    };
  }

  dispatch(input: IndexedPassWorkerInput, dims: { width: number; height: number }): void {
    this.pendingDims = dims;
    // No transferable list: `IndexedPassRunner` may wrap the live filtered bitmap buffer (`new Uint8Array(img.data)`),
    // and transferring would detach that backing store under the engine image.
    this.worker.postMessage(input);
  }

  dispose(): void {
    this.pendingDims = null;
    this.worker.terminate();
  }
}
