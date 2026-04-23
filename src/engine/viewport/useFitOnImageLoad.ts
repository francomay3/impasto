import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { RawImage } from '../../types';
import { useImpastoEngine } from '../core/ImpastoEngineContext';

/**
 * Fits via `engine.viewport.fitToImage()` (hub size from ViewportWrapper ResizeObserver, with host rect fallback).
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
      if (lastFittedToImage.current === image) return;

      const host = hostRef.current;
      if (host) {
        const { width, height } = host.getBoundingClientRect();
        if (width > 0 && height > 0) {
          engine.viewport.setViewportSize(width, height);
        }
      }

      const applied = engine.viewport.fitToImage();
      if (!applied) return;
      lastFittedToImage.current = image;
    }

    tryFit();
    return engine.image.subscribe(tryFit);
  }, [engine, hostRef]);
}
