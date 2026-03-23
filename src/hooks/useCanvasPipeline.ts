import { useRef, useCallback, useEffect } from 'react';
import type { FilterSettings, Color } from '../types';
import { applyFilters } from '../utils/imageProcessing';
import { quantizeImage } from '../utils/kMeansWrapper';
import { findMixRecipe } from '../services/ColorMixer';
import IndexedRendererWorker from '../workers/indexedRenderer.worker?worker';

export function useCanvasPipeline() {
  const sourceCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const filteredCanvasRef = useRef<HTMLCanvasElement>(null);
  const indexedCanvasRef = useRef<HTMLCanvasElement>(null);
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
      const remapped = new ImageData(new Uint8ClampedArray(buffer), width, height);
      indexed.getContext('2d')!.putImageData(remapped, 0, 0);
    };

    return () => worker.terminate();
  }, []);

  const loadImage = useCallback((dataUrl: string): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = sourceCanvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.src = dataUrl;
    });
  }, []);

  const applyFilterPipeline = useCallback((filters: FilterSettings): ImageData | null => {
    const src = sourceCanvasRef.current;
    const filtered = filteredCanvasRef.current;
    if (!src || !filtered) return null;
    filtered.width = src.width;
    filtered.height = src.height;
    const srcCtx = src.getContext('2d', { willReadFrequently: true })!;
    const filteredCtx = filtered.getContext('2d')!;
    const imageData = applyFilters(srcCtx.getImageData(0, 0, src.width, src.height), filters);
    filteredCtx.putImageData(imageData, 0, 0);
    return imageData;
  }, []);

  const blurImageData = useCallback((imageData: ImageData, blur: number): ImageData => {
    if (blur === 0) return imageData;
    const { width, height } = imageData;
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    const blurred = document.createElement('canvas');
    blurred.width = width;
    blurred.height = height;
    const bCtx = blurred.getContext('2d', { willReadFrequently: true })!;
    bCtx.filter = `blur(${blur}px)`;
    bCtx.drawImage(offscreen, 0, 0);
    bCtx.filter = 'none';
    return bCtx.getImageData(0, 0, width, height);
  }, []);

  const runQuantization = useCallback((
    imageData: ImageData,
    k: number,
    lockedColors: Color[]
  ): Color[] => {
    const colors = quantizeImage(imageData, k, lockedColors);
    return colors.map(c => ({ ...c, mixRecipe: findMixRecipe(c.hex) }));
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

    // Clone the buffer so we can transfer it without neutering lastImageDataRef
    const bufferCopy = imageData.data.slice().buffer;
    worker.postMessage(
      { data: new Uint8ClampedArray(bufferCopy), width: imageData.width, height: imageData.height, palette, generation },
      [bufferCopy]
    );
  }, []);

  return {
    sourceCanvasRef,
    filteredCanvasRef,
    indexedCanvasRef,
    loadImage,
    applyFilterPipeline,
    blurImageData,
    runQuantization,
    renderIndexed,
  };
}
