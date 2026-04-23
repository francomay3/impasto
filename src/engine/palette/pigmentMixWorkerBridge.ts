import MixPaletteWorker from '../../workers/mix-palette.worker?worker';
import type { Pigment } from '../../types';
import type { MixPaletteWorkerOutput } from '../../workers/mixPaletteWorkerProtocol';

type PigmentMixWorkerBridgeRequest = {
  hexes: string[];
  pigments: Pigment[];
  minPaintPercent: number;
  deltaThreshold: number;
  signal: AbortSignal;
};

function abortDom(): DOMException {
  return new DOMException('aborted', 'AbortError');
}

type Pending = {
  cleanup: () => void;
  resolve: (v: MixPaletteWorkerOutput) => void;
  reject: (e: DOMException) => void;
};

/** Terminates the worker on supersede/abort so the mix-palette protocol need not carry request ids. */
export class PigmentMixWorkerBridge {
  private worker: Worker;
  private pending: Pending | null = null;

  constructor() {
    this.worker = new MixPaletteWorker();
    this.wireWorker();
  }

  private wireWorker(): void {
    this.worker.onmessage = (e: MessageEvent<MixPaletteWorkerOutput>) => {
      const p = this.pending;
      this.pending = null;
      if (!p) return;
      p.cleanup();
      p.resolve(e.data);
    };
    this.worker.onerror = () => {
      const p = this.pending;
      this.pending = null;
      if (p) {
        p.cleanup();
        p.reject(new DOMException('mix-palette worker error', 'DataError'));
      }
    };
  }

  private replaceWorker(): void {
    this.worker.terminate();
    this.worker = new MixPaletteWorker();
    this.wireWorker();
  }

  private cancelInFlight(reason: DOMException): void {
    const p = this.pending;
    if (!p) return;
    this.pending = null;
    p.cleanup();
    p.reject(reason);
    this.replaceWorker();
  }

  mix(req: PigmentMixWorkerBridgeRequest): Promise<MixPaletteWorkerOutput> {
    if (req.signal.aborted) return Promise.reject(abortDom());
    this.cancelInFlight(abortDom());
    return new Promise<MixPaletteWorkerOutput>((resolve, reject) => {
      const cleanup = () => req.signal.removeEventListener('abort', onAbort);
      const slot: Pending = {
        cleanup,
        resolve: (v) => {
          cleanup();
          resolve(v);
        },
        reject: (e) => {
          cleanup();
          reject(e);
        },
      };
      const onAbort = () => {
        if (this.pending !== slot) return;
        this.pending = null;
        this.replaceWorker();
        slot.reject(abortDom());
      };
      req.signal.addEventListener('abort', onAbort, { once: true });
      this.pending = slot;
      this.worker.postMessage({
        hexes: req.hexes,
        pigments: req.pigments,
        minPaintPercent: req.minPaintPercent,
        deltaThreshold: req.deltaThreshold,
      });
    });
  }

  dispose(): void {
    const p = this.pending;
    this.pending = null;
    if (p) {
      p.cleanup();
      p.reject(abortDom());
    }
    this.worker.terminate();
  }
}
