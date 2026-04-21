import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { RawImage } from '../../types';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import { fitToContain } from './fitToContain';

/**
 * Fits the shared viewport transform with {@link fitToContain} for the current host — same math as
 * {@link ViewportWrapper}'s double‑click reset.
 *
 * Runs on mount and whenever the **source raster instance** changes (first decode, import/replace, persistence
 * fetch, undo/redo image steps). Skips when the engine already holds the same `RawImage` reference so stray
 * `image.subscribe` notifications do not override user pan/zoom.
 *
 * `lastFittedToImage` is a ref (not state) so guards never trigger a re-render.
 */
export function useFitOnImageLoad(hostRef: RefObject<HTMLDivElement | null>): void {
  const engine = useImpastoEngine();
  const lastFittedToImage = useRef<RawImage | null>(null);

  useLayoutEffect(() => {
    function tryFit() {
      const image = engine.image.get();
      if (!image) {
        lastFittedToImage.current = null;
        return;
      }
      const host = hostRef.current;
      if (!host) return;
      const { width: vpW, height: vpH } = host.getBoundingClientRect();
      if (vpW === 0 || vpH === 0) return;
      if (lastFittedToImage.current === image) return;

      engine.viewport.requestTransform(fitToContain(image.width, image.height, vpW, vpH));
      lastFittedToImage.current = image;
    }

    tryFit();
    return engine.image.subscribe(tryFit);
  }, [engine, hostRef]);
}
