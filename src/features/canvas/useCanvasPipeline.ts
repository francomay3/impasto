import { useRef, useCallback } from 'react';
import type { FilterInstance, Color, RawImage } from '../../types';
import { createRawImage } from '../../types';
import { applyFilters } from '../../utils/imageProcessing';
import { quantizeImage } from '../../utils/kMeansWrapper';
import { findMixRecipe } from '../../services/ColorMixer';

export function useCanvasPipeline(
  filteredCanvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const sourceCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

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

  return {
    sourceCanvasRef,
    loadImage,
    loadBitmap,
    applyFilterPipeline,
    runQuantization,
  };
}
