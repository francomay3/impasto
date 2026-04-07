import { useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import type { FilterInstance, RawImage, ColorSample } from '../../types';
import type { CanvasPipeline } from '../canvas/engine/pipeline';
import type { useProjectState } from './useProjectState';
import { sampleCircleAverage } from '../../utils/imageProcessing';
import { rgbToHex } from '../../utils/colorUtils';
import { useColorSamplingHandlers } from './useColorSamplingHandlers';
import type { SamplingLevels } from '../filters/FilterContext';

type Pipeline = CanvasPipeline;
type ProjectActions = ReturnType<typeof useProjectState>;

interface Options {
  state: ProjectActions['state'];
  sourceImage: RawImage | null;
  pipeline: Pipeline;
  setImage: ProjectActions['setImage'];
  onImageLoaded: (image: RawImage) => void;
  updateColor: ProjectActions['updateColor'];
  setPalette: ProjectActions['updateDerivedPalette'];
  addSampledColor: ProjectActions['addSampledColor'];
  removeColor: ProjectActions['removeColor'];
  updateFilter: ProjectActions['updateFilter'];
  samplingColorId: string | null;
  completeSample: () => void;
  cancelSample: () => void;
  samplingLevels: SamplingLevels | null;
  resetTransform?: () => void;
  saveThumbnailColors?: (colors: string[]) => void;
}

export function useImageHandlers({
  state, sourceImage, pipeline, setImage, onImageLoaded, updateColor, setPalette,
  addSampledColor, removeColor, updateFilter, samplingColorId,
  completeSample, cancelSample, samplingLevels, resetTransform, saveThumbnailColors,
}: Options) {
  const lastImageDataRef = useRef<ImageData | null>(null);
  const [debouncedFilters] = useDebouncedValue(state.filters, 300);
  const saveThumbnailColorsRef = useRef(saveThumbnailColors);

  const pipelineRef = useRef(pipeline);
  const resetTransformRef = useRef(resetTransform);
  const debouncedFiltersRef = useRef(debouncedFilters);
  const sourceImageRef = useRef(sourceImage);
  const filtersRef = useRef(state.filters);
  useLayoutEffect(() => {
    saveThumbnailColorsRef.current = saveThumbnailColors;
    pipelineRef.current = pipeline;
    resetTransformRef.current = resetTransform;
    debouncedFiltersRef.current = debouncedFilters;
    sourceImageRef.current = sourceImage;
    filtersRef.current = state.filters;
  });

  const deriveAndRender = useCallback(
    (imageData: ImageData) => {
      lastImageDataRef.current = imageData;
      const sampled = state.palette.filter((c) => c.sample);
      if (sampled.length === 0) return;
      const newPalette = state.palette.map((c) => {
        if (!c.sample) return c;
        const [r, g, b] = sampleCircleAverage(imageData, c.sample.x, c.sample.y, c.sample.radius);
        return { ...c, hex: rgbToHex(r, g, b) };
      });
      setPalette(newPalette);
      saveThumbnailColorsRef.current?.(newPalette.map((c) => c.hex).filter(Boolean));
    },
    [state.palette, setPalette]
  );
  const deriveAndRenderRef = useRef(deriveAndRender);
  useLayoutEffect(() => { deriveAndRenderRef.current = deriveAndRender; });

  // Runs when filters change (debounced). Uses refs for pipeline/sourceImage/deriveAndRender.
  useEffect(() => {
    if (!sourceImageRef.current) return;
    const imageData = pipelineRef.current.applyFilterPipeline(debouncedFilters as FilterInstance[]);
    if (imageData) deriveAndRenderRef.current(imageData);
  }, [debouncedFilters]);

  const handleImageRestore = useCallback((image: RawImage | null) => {
    if (!image) return;
    resetTransformRef.current?.();
    pipelineRef.current.loadImage(image);
    const imageData = pipelineRef.current.applyFilterPipeline(debouncedFiltersRef.current as FilterInstance[]);
    if (imageData) deriveAndRenderRef.current(imageData);
  }, []);

  const handleImageLoadBitmap = useCallback(
    (bitmap: ImageBitmap) => {
      resetTransformRef.current?.();
      const rawImage = pipelineRef.current.loadBitmap(bitmap);
      onImageLoaded(rawImage);
      setImage();
      const imageData = pipelineRef.current.applyFilterPipeline(filtersRef.current as FilterInstance[]);
      if (imageData) deriveAndRenderRef.current(imageData);
      bitmap.close();
    },
    [setImage, onImageLoaded]
  );

  const handleAddColorAtPosition = useCallback(
    (sample: ColorSample, hex: string): string => {
      const id = crypto.randomUUID();
      addSampledColor(id, sample, hex);
      return id;
    },
    [addSampledColor]
  );

  const handleDeleteColor = useCallback(
    (id: string) => {
      removeColor(id);
      if (samplingColorId === id) cancelSample();
    },
    [removeColor, samplingColorId, cancelSample]
  );

  const samplingHandlers = useColorSamplingHandlers({
    lastImageDataRef,
    samplingColorId, samplingLevels,
    completeSample, cancelSample,
    palette: state.palette, filters: state.filters,
    updateColor, updateFilter, setPalette,
  });

  return {
    handleImageLoadBitmap,
    handleImageRestore,
    handleAddColorAtPosition,
    handleDeleteColor,
    ...samplingHandlers,
  };
}
