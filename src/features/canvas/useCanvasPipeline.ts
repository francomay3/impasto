import { useRef, useCallback, useEffect } from 'react';
import type { FilterInstance, Color, RawImage } from '../../types';
import { createRawImage } from '../../types';
import { applyFilters, blurImageData } from '../../utils/imageProcessing';
import { quantizeImage } from '../../utils/kMeansWrapper';
import { findMixRecipe } from '../../services/ColorMixer';
import IndexedRendererWorker from '../../workers/indexedRenderer.worker?worker';

export function useCanvasPipeline(
  filteredCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  indexedCanvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const sourceCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const workerRef = useRef<Worker | null>(null);
  const renderGenerationRef = useRef(0);

  useEffect(() => {
    const worker = new IndexedRendererWorker();
    workerRef.current = worker;
    worker.onmessage = (
      e: MessageEvent<{ buffer: ArrayBuffer; width: number; height: number; generation: number }>
    ) => {
      const { buffer, width, height, generation } = e.data;
      if (generation !== renderGenerationRef.current) return;
      const indexed = indexedCanvasRef.current;
      if (!indexed) return;
      indexed
        .getContext('2d')!
        .putImageData(new ImageData(new Uint8ClampedArray(buffer), width, height), 0, 0);
    };
    return () => worker.terminate();
  }, [indexedCanvasRef]);

  const loadImage = useCallback((image: RawImage): void => {
    const canvas = sourceCanvasRef.current;
    canvas.width = image.width;
    canvas.height = image.height;
    canvas
      .getContext('2d', { willReadFrequently: true })!
      .putImageData(new ImageData(image.data, image.width, image.height), 0, 0);
  }, []);

  // Draws a bitmap directly into the source canvas and returns the raw pixels.
  // Uses willReadFrequently so getImageData is a fast CPU read — no GPU stall.
  const loadBitmap = useCallback((bitmap: ImageBitmap): RawImage => {
    const canvas = sourceCanvasRef.current;
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return createRawImage(data, width, height);
  }, []);

  const applyFilterPipeline = useCallback(
    (filters: FilterInstance[]): ImageData | null => {
      const src = sourceCanvasRef.current;
      const filtered = filteredCanvasRef.current;
      if (!src || !filtered) return null;
      filtered.width = src.width;
      filtered.height = src.height;
      const imageData = applyFilters(
        src
          .getContext('2d', { willReadFrequently: true })!
          .getImageData(0, 0, src.width, src.height),
        filters
      );
      filtered.getContext('2d')!.putImageData(imageData, 0, 0);
      return imageData;
    },
    [filteredCanvasRef]
  );

  const runQuantization = useCallback(
    (imageData: ImageData, k: number, lockedColors: Color[]): Color[] => {
      return quantizeImage(imageData, k, lockedColors).map((c) => ({
        ...c,
        mixRecipe: findMixRecipe(c.hex),
      }));
    },
    []
  );

  const renderIndexed = useCallback(
    (palette: Color[], sourceData?: ImageData) => {
      const filtered = filteredCanvasRef.current;
      const indexed = indexedCanvasRef.current;
      const worker = workerRef.current;
      if (!filtered || !indexed || !worker || palette.length === 0) return;
      if (indexed.width !== filtered.width || indexed.height !== filtered.height) {
        indexed.width = filtered.width;
        indexed.height = filtered.height;
      }
      const imageData =
        sourceData ??
        filtered
          .getContext('2d', { willReadFrequently: true })!
          .getImageData(0, 0, filtered.width, filtered.height);
      const generation = ++renderGenerationRef.current;
      const bufferCopy = imageData.data.slice().buffer;
      worker.postMessage(
        {
          data: new Uint8ClampedArray(bufferCopy),
          width: imageData.width,
          height: imageData.height,
          palette,
          generation,
        },
        [bufferCopy]
      );
    },
    [filteredCanvasRef, indexedCanvasRef]
  );

  return {
    sourceCanvasRef,
    loadImage,
    loadBitmap,
    applyFilterPipeline,
    blurImageData,
    runQuantization,
    renderIndexed,
  };
}
