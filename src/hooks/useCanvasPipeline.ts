import { useRef, useCallback, useEffect } from 'react';
import type { FilterInstance, Color } from '../types';
import { applyFilters } from '../utils/imageProcessing';
import { quantizeImage } from '../utils/kMeansWrapper';
import { findMixRecipe } from '../services/ColorMixer';
import IndexedRendererWorker from '../workers/indexedRenderer.worker?worker';

export function useCanvasPipeline(
  filteredCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  indexedCanvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const sourceCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const workerRef = useRef<Worker | null>(null);
  const renderGenerationRef = useRef(0);

  useEffect(() => {
    const worker = new IndexedRendererWorker();
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer; width: number; height: number; generation: number }>) => {
      const { buffer, width, height, generation } = e.data;
      if (generation !== renderGenerationRef.current) return;
      const indexed = indexedCanvasRef.current;
      if (!indexed) return;
      indexed.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(buffer), width, height), 0, 0);
    };
    return () => worker.terminate();
  }, [indexedCanvasRef]);

  const loadImage = useCallback((dataUrl: string): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = sourceCanvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d', { willReadFrequently: true })!.drawImage(img, 0, 0);
        resolve();
      };
      img.src = dataUrl;
    });
  }, []);

  const applyFilterPipeline = useCallback((filters: FilterInstance[]): ImageData | null => {
    const src = sourceCanvasRef.current;
    const filtered = filteredCanvasRef.current;
    if (!src || !filtered) return null;
    filtered.width = src.width;
    filtered.height = src.height;
    const imageData = applyFilters(src.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, src.width, src.height), filters);
    filtered.getContext('2d')!.putImageData(imageData, 0, 0);
    return imageData;
  }, [filteredCanvasRef]);

  const blurImageData = useCallback((imageData: ImageData, blur: number): ImageData => {
    if (blur === 0) return imageData;
    const { width, height } = imageData;
    const src = document.createElement('canvas');
    src.width = width; src.height = height;
    src.getContext('2d')!.putImageData(imageData, 0, 0);
    const dst = document.createElement('canvas');
    dst.width = width; dst.height = height;
    const dCtx = dst.getContext('2d', { willReadFrequently: true })!;
    dCtx.filter = `blur(${blur}px)`;
    dCtx.drawImage(src, 0, 0);
    dCtx.filter = 'none';
    return dCtx.getImageData(0, 0, width, height);
  }, []);

  const runQuantization = useCallback((imageData: ImageData, k: number, lockedColors: Color[]): Color[] => {
    return quantizeImage(imageData, k, lockedColors).map(c => ({ ...c, mixRecipe: findMixRecipe(c.hex) }));
  }, []);

  const renderIndexed = useCallback((palette: Color[], sourceData?: ImageData) => {
    const filtered = filteredCanvasRef.current;
    const indexed = indexedCanvasRef.current;
    const worker = workerRef.current;
    if (!filtered || !indexed || !worker || palette.length === 0) return;
    indexed.width = filtered.width;
    indexed.height = filtered.height;
    const imageData = sourceData ?? filtered.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, filtered.width, filtered.height);
    const generation = ++renderGenerationRef.current;
    const bufferCopy = imageData.data.slice().buffer;
    worker.postMessage({ data: new Uint8ClampedArray(bufferCopy), width: imageData.width, height: imageData.height, palette, generation }, [bufferCopy]);
  }, [filteredCanvasRef, indexedCanvasRef]);

  return { sourceCanvasRef, loadImage, applyFilterPipeline, blurImageData, runQuantization, renderIndexed };
}
