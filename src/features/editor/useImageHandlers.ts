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
  setSamplingColorId: (id: string | null) => void;
  samplingLevels: SamplingLevels | null;
  setSamplingLevels: (v: SamplingLevels | null) => void;
  resetTransform?: () => void;
}

export function useImageHandlers({
  state, pipeline, setImage, updateColor, setPalette, addSampledColor,
  removeColor, updateFilter, samplingColorId, setSamplingColorId,
  samplingLevels, setSamplingLevels, resetTransform,
}: Options) {
  const lastImageDataRef = useRef<ImageData | null>(null);
  const pendingNewColorId = useRef<string | null>(null);
  const justLoadedImageRef = useRef<object | null>(null);
  const [debouncedFilters] = useDebouncedValue(state.filters, 300);

  const renderPalette = useCallback(
    (imageData?: ImageData, palette?: typeof state.palette) => {
      const data = imageData ?? lastImageDataRef.current;
      if (!data) return;
      const activePalette = palette ?? state.palette;
      if (activePalette.length === 0) return;
      const forIndexing = pipeline.blurImageData(data, state.preIndexingBlur);
      pipeline.renderIndexed(activePalette, forIndexing);
    },
    [pipeline, state]
  );

  const deriveAndRender = useCallback(
    (imageData: ImageData) => {
      lastImageDataRef.current = imageData;
      const sampled = state.palette.filter((c) => c.sample);
      if (sampled.length === 0) { renderPalette(imageData); return; }
      const newPalette = state.palette.map((c) => {
        if (!c.sample) return c;
        const [r, g, b] = sampleCircleAverage(imageData, c.sample.x, c.sample.y, c.sample.radius);
        return { ...c, hex: rgbToHex(r, g, b) };
      });
      setPalette(newPalette);
      renderPalette(imageData, newPalette);
    },
    [state.palette, setPalette, renderPalette]
  );

  useEffect(() => {
    if (!state.sourceImage) return;
    if (state.sourceImage === justLoadedImageRef.current) { justLoadedImageRef.current = null; return; }
    resetTransform?.();
    pipeline.loadImage(state.sourceImage);
    const imageData = pipeline.applyFilterPipeline(debouncedFilters as FilterInstance[]);
    if (imageData) deriveAndRender(imageData);
  }, [state.sourceImage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!state.sourceImage) return;
    const imageData = pipeline.applyFilterPipeline(debouncedFilters as FilterInstance[]);
    if (imageData) deriveAndRender(imageData);
  }, [debouncedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!state.sourceImage) return;
    renderPalette();
  }, [state.preIndexingBlur]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!state.sourceImage) return;
    renderPalette();
  }, [state.palette]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageLoadBitmap = useCallback(
    (bitmap: ImageBitmap) => {
      resetTransform?.();
      const rawImage = pipeline.loadBitmap(bitmap);
      justLoadedImageRef.current = rawImage;
      setImage(rawImage);
      const imageData = pipeline.applyFilterPipeline(state.filters as FilterInstance[]);
      if (imageData) deriveAndRender(imageData);
      bitmap.close();
    },
    [pipeline, setImage, deriveAndRender, resetTransform, state.filters]
  );

  const handleAddColor = useCallback(() => {
    const id = crypto.randomUUID();
    pendingNewColorId.current = id;
    const pending = { id, hex: '#000000', locked: false, ratio: 0, mixRecipe: '' } as const;
    setPalette([...state.palette, pending]);
    renderPalette(undefined, [...state.palette, pending]);
    setSamplingColorId(id);
  }, [setPalette, renderPalette, state.palette, setSamplingColorId]);

  const handleAddColorAtPosition = useCallback(
    (sample: ColorSample, hex: string): string => {
      const id = crypto.randomUUID();
      addSampledColor(id, sample, hex);
      renderPalette(undefined, [
        ...state.palette,
        { id, hex, sample, locked: false, ratio: 0, mixRecipe: '' },
      ]);
      return id;
    },
    [addSampledColor, renderPalette, state.palette]
  );

  const handleDeleteColor = useCallback(
    (id: string) => {
      removeColor(id);
      renderPalette(undefined, state.palette.filter((c) => c.id !== id));
      if (samplingColorId === id) setSamplingColorId(null);
    },
    [removeColor, renderPalette, state.palette, samplingColorId, setSamplingColorId]
  );

  const samplingHandlers = useColorSamplingHandlers({
    pendingNewColorId, lastImageDataRef,
    samplingColorId, setSamplingColorId,
    samplingLevels, setSamplingLevels,
    palette: state.palette, filters: state.filters,
    updateColor, updateFilter, removeColor, setPalette, renderPalette,
  });

  return {
    handleImageLoadBitmap,
    handleAddColor,
    handleAddColorAtPosition,
    handleDeleteColor,
    ...samplingHandlers,
  };
}
