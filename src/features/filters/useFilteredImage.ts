import { useEffect, useRef, useState } from 'react';
import type { FilterInstance, RawImage } from '../../types';
import { useWorkerBackpressure } from '../../hooks/useWorkerBackpressure';
import ImgPipelineWorker from '../../workers/img-pipeline.worker?worker';

const WARN_PIXELS = 1920 * 1080;

type WorkerOutput = { steps: ArrayBuffer[]; dirtyIndex: number };

export function useFilteredImage(sourceImage: RawImage | null, filters: FilterInstance[]) {
  const [displayData, setDisplayData] = useState<ImageData | null>(null);
  const sentFiltersRef = useRef<FilterInstance[]>([]);
  const cacheRef = useRef<(Uint8Array | null)[]>([]);
  const prevFiltersRef = useRef<FilterInstance[]>([]);
  const filtersRef = useRef(filters);
  const sourceRef = useRef(sourceImage);
  filtersRef.current = filters;
  sourceRef.current = sourceImage;

  const { workerRef, busyRef, fireRef, schedule } = useWorkerBackpressure<WorkerOutput>({
    createWorker: () => new ImgPipelineWorker(),
    onMessage: ({ steps, dirtyIndex }) => {
      const source = sourceRef.current!;
      const currentFilters = filtersRef.current;
      for (let i = 0; i < steps.length; i++) {
        cacheRef.current[dirtyIndex + 1 + i] = new Uint8Array(steps[i]);
      }
      cacheRef.current.length = currentFilters.length + 1;
      setDisplayData(
        new ImageData(new Uint8ClampedArray(steps[steps.length - 1]), source.width, source.height)
      );
      prevFiltersRef.current = sentFiltersRef.current;
    },
    errorLabel: 'img_pipeline worker',
  });

  fireRef.current = () => {
    const source = sourceRef.current;
    const currentFilters = filtersRef.current;
    if (!source) return;

    if (currentFilters.length === 0) {
      setDisplayData(
        new ImageData(new Uint8ClampedArray(source.data), source.width, source.height)
      );
      prevFiltersRef.current = [];
      return;
    }

    // Find the first filter that changed (deep compare via JSON).
    const prev = prevFiltersRef.current;
    let dirtyIndex = Math.min(prev.length, currentFilters.length);
    for (let i = 0; i < dirtyIndex; i++) {
      if (
        prev[i].type !== currentFilters[i].type ||
        JSON.stringify(prev[i].params) !== JSON.stringify(currentFilters[i].params)
      ) {
        dirtyIndex = i;
        break;
      }
    }

    const filtersToApply = currentFilters.slice(dirtyIndex);

    // If nothing to reapply (filters only removed from end), serve from cache.
    if (filtersToApply.length === 0) {
      const cached = cacheRef.current[dirtyIndex];
      if (cached) {
        setDisplayData(new ImageData(new Uint8ClampedArray(cached), source.width, source.height));
        prevFiltersRef.current = [...currentFilters];
        return;
      }
    }

    const startPixels = cacheRef.current[dirtyIndex] ?? cacheRef.current[0]!;
    const pixelsCopy = new Uint8Array(startPixels);
    busyRef.current = true;
    sentFiltersRef.current = [...currentFilters];
    workerRef.current!.postMessage(
      {
        pixels: pixelsCopy,
        width: source.width,
        height: source.height,
        filters: filtersToApply,
        dirtyIndex,
      },
      [pixelsCopy.buffer]
    );
  };

  useEffect(() => {
    if (!sourceImage) return;
    const px = sourceImage.width * sourceImage.height;
    if (px > WARN_PIXELS) {
      console.warn(
        `[useFilteredImage] Source is ${sourceImage.width}×${sourceImage.height} ` +
          `(${(px / 1e6).toFixed(1)}MP). Keep images under 2MP (~1920×1080) for best performance.`
      );
    }
    cacheRef.current = [new Uint8Array(sourceImage.data)];
    prevFiltersRef.current = [];
    schedule();
  }, [sourceImage, schedule]);

  // Deep-compare filters so reference changes don't cause unnecessary work.
  const filtersKey = JSON.stringify(filters.map((f) => ({ type: f.type, params: f.params })));
  useEffect(() => {
    if (!sourceImage) return;
    schedule();
    // filtersKey is intentionally used instead of filters to avoid firing on reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, schedule]);

  return displayData;
}
