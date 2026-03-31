import { useState, useEffect, useRef } from 'react';
import type { Pigment } from '../types';
import MixPaletteWorker from '../workers/mix-palette.worker?worker';

type LabColor = { l: number; a: number; b: number };

export function useMixedPalette(
  hexes: string[],
  pigments: Pigment[],
  minPaintPercent: number,
  deltaThreshold: number,
  enabled: boolean
): { data: LabColor[] | null; isLoading: boolean } {
  const [data, setData] = useState<LabColor[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const configKey = enabled
    ? JSON.stringify({ hexes, pigments, minPaintPercent, deltaThreshold })
    : null;

  useEffect(() => {
    if (!configKey || hexes.length === 0) {
      setData(null);
      setIsLoading(false);
      return;
    }

    if (workerRef.current) workerRef.current.terminate();

    const worker = new MixPaletteWorker();
    workerRef.current = worker;
    setIsLoading(true);

    worker.onmessage = (e: MessageEvent<LabColor[]>) => {
      setData(e.data);
      setIsLoading(false);
    };

    worker.postMessage({
      hexes,
      pigments,
      minPaintPercent,
      deltaThreshold,
    });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // configKey encodes all inputs — used deliberately instead of the raw values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  // Reset data when disabled
  useEffect(() => {
    if (!enabled) setData(null);
  }, [enabled]);

  return { data, isLoading };
}
