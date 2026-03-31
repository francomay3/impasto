import { useRef, useCallback, useEffect } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import type { FilterInstance, ColorSample } from '../../types';
import type { useCanvasPipeline } from '../canvas/useCanvasPipeline';
import type { useProjectState } from './useProjectState';
import { sampleCircleAverage } from '../../utils/imageProcessing';
import { rgbToHex } from '../../utils/colorUtils';
import { useColorSamplingHandlers } from './useColorSamplingHandlers';
import type { SamplingLevels } from '../filters/FilterContext';

type Pipeline = ReturnType<typeof useCanvasPipeline>;
type ProjectActions = ReturnType<typeof useProjectState>;

interface Options {
  state: ProjectActions['state'];
  pipeline: Pipeline;
  setImage: ProjectActions['setImage'];
  updateColor: ProjectActions['updateColor'];
  setPalette: ProjectActions['updateDerivedPalette'];
  addSampledColor: ProjectActions['addSampledColor'];
  removeColor: ProjectActions['removeColor'];
  updateFilter: ProjectActions['updateFilter'];
  samplingColorId: string | null;
  startSamplingColor: (id: string) => void;
  completeSample: () => void;
  cancelSample: () => void;
  samplingLevels: SamplingLevels | null;
  resetTransform?: () => void;
}

export function useImageHandlers({
  state, pipeline, setImage, updateColor, setPalette, addSampledColor,
  removeColor, updateFilter, samplingColorId, startSamplingColor,
  completeSample, cancelSample, samplingLevels, resetTransform,
}: Options) {
  const lastImageDataRef = useRef<ImageData | null>(null);
  const pendingNewColorIdRef = useRef<string | null>(null);
  const justLoadedImageRef = useRef<object | null>(null);
  const [debouncedFilters] = useDebouncedValue(state.filters, 300);

  // Refs so effects and callbacks can access fresh values without extra deps.
  const pipelineRef = useRef(pipeline);
  pipelineRef.current = pipeline;
  const resetTransformRef = useRef(resetTransform);
  resetTransformRef.current = resetTransform;
  const debouncedFiltersRef = useRef(debouncedFilters);
  debouncedFiltersRef.current = debouncedFilters;
  const sourceImageRef = useRef(state.sourceImage);
  sourceImageRef.current = state.sourceImage;
  const filtersRef = useRef(state.filters);
  filtersRef.current = state.filters;

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
    },
    [state.palette, setPalette]
  );
  const deriveAndRenderRef = useRef(deriveAndRender);
  deriveAndRenderRef.current = deriveAndRender;

  // Runs when the source image is replaced externally (e.g. project load).
  // Uses refs for pipeline/filters/deriveAndRender so filter changes don't re-trigger this.
  useEffect(() => {
    const image = state.sourceImage;
    if (!image) return;
    if (image === justLoadedImageRef.current) { justLoadedImageRef.current = null; return; }
    resetTransformRef.current?.();
    pipelineRef.current.loadImage(image);
    const imageData = pipelineRef.current.applyFilterPipeline(debouncedFiltersRef.current as FilterInstance[]);
    if (imageData) deriveAndRenderRef.current(imageData);
  }, [state.sourceImage]);

  // Runs when filters change (debounced). Uses refs for pipeline/sourceImage/deriveAndRender.
  useEffect(() => {
    if (!sourceImageRef.current) return;
    const imageData = pipelineRef.current.applyFilterPipeline(debouncedFilters as FilterInstance[]);
    if (imageData) deriveAndRenderRef.current(imageData);
  }, [debouncedFilters]);

  const handleImageLoadBitmap = useCallback(
    (bitmap: ImageBitmap) => {
      resetTransformRef.current?.();
      const rawImage = pipelineRef.current.loadBitmap(bitmap);
      justLoadedImageRef.current = rawImage;
      setImage(rawImage);
      const imageData = pipelineRef.current.applyFilterPipeline(filtersRef.current as FilterInstance[]);
      if (imageData) deriveAndRenderRef.current(imageData);
      bitmap.close();
    },
    [setImage]
  );

  const handleAddColor = useCallback(() => {
    const id = crypto.randomUUID();
    pendingNewColorIdRef.current = id;
    const pending = { id, hex: '#000000', locked: false, ratio: 0, mixRecipe: '' } as const;
    setPalette([...state.palette, pending]);
    startSamplingColor(id);
  }, [setPalette, state.palette, startSamplingColor]);

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
    pendingNewColorIdRef, lastImageDataRef,
    samplingColorId, samplingLevels,
    completeSample, cancelSample,
    palette: state.palette, filters: state.filters,
    updateColor, updateFilter, removeColor, setPalette,
  });

  return {
    handleImageLoadBitmap,
    handleAddColor,
    handleAddColorAtPosition,
    handleDeleteColor,
    ...samplingHandlers,
  };
}
