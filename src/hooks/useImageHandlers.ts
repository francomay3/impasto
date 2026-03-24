import { useRef, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useDebouncedValue } from '@mantine/hooks';
import type { FilterInstance, LevelsParams } from '../types';
import type { useCanvasPipeline } from './useCanvasPipeline';
import type { useProjectState } from './useProjectState';

type Pipeline = ReturnType<typeof useCanvasPipeline>;
type ProjectActions = ReturnType<typeof useProjectState>;

interface Options {
  state: ProjectActions['state'];
  pipeline: Pipeline;
  setImage: ProjectActions['setImage'];
  updateColor: ProjectActions['updateColor'];
  addColor: ProjectActions['addColor'];
  removeColor: ProjectActions['removeColor'];
  updateFilter: ProjectActions['updateFilter'];
  samplingColorId: string | null;
  setSamplingColorId: (id: string | null) => void;
  samplingLevels: { filterId: string; point: 'black' | 'white' } | null;
  setSamplingLevels: (v: { filterId: string; point: 'black' | 'white' } | null) => void;
}

export function useImageHandlers({
  state, pipeline, setImage, updateColor, addColor, removeColor, updateFilter,
  samplingColorId, setSamplingColorId, samplingLevels, setSamplingLevels,
}: Options) {
  const lastImageDataRef = useRef<ImageData | null>(null);
  const [debouncedFilters] = useDebouncedValue(state.filters, 300);

  const renderPalette = useCallback((imageData?: ImageData, palette?: typeof state.palette) => {
    const data = imageData ?? lastImageDataRef.current;
    if (!data) return;
    const forIndexing = pipeline.blurImageData(data, state.preIndexingBlur);
    pipeline.renderIndexed(palette ?? state.palette, forIndexing);
  }, [pipeline, state]);

  useEffect(() => {
    if (!state.imageDataUrl) return;
    pipeline.loadImage(state.imageDataUrl).then(() => {
      const imageData = pipeline.applyFilterPipeline(debouncedFilters as FilterInstance[]);
      if (imageData) { lastImageDataRef.current = imageData; renderPalette(imageData); }
    });
  }, [state.imageDataUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!state.imageDataUrl) return;
    const imageData = pipeline.applyFilterPipeline(debouncedFilters as FilterInstance[]);
    if (imageData) { lastImageDataRef.current = imageData; renderPalette(imageData); }
  }, [debouncedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageLoad = useCallback((dataUrl: string) => { setImage(dataUrl); }, [setImage]);

  const handleColorChange = useCallback((id: string, hex: string) => {
    updateColor(id, { hex });
    renderPalette(undefined, state.palette.map(c => c.id === id ? { ...c, hex } : c));
  }, [updateColor, renderPalette, state.palette]);

  const handleAddColor = useCallback(() => {
    const id = crypto.randomUUID();
    addColor(id);
    renderPalette(undefined, [...state.palette, { id, hex: '#000000', locked: false, ratio: 0, mixRecipe: '' }]);
    setSamplingColorId(id);
  }, [addColor, renderPalette, state.palette, setSamplingColorId]);

  const handleDeleteColor = useCallback((id: string) => {
    removeColor(id);
    renderPalette(undefined, state.palette.filter(c => c.id !== id));
    if (samplingColorId === id) setSamplingColorId(null);
  }, [removeColor, renderPalette, state.palette, samplingColorId, setSamplingColorId]);

  const handleToggleHighlight = useCallback((id: string) => {
    const highlighted = !state.palette.find(c => c.id === id)?.highlighted;
    updateColor(id, { highlighted });
    renderPalette(undefined, state.palette.map(c => c.id === id ? { ...c, highlighted } : c));
  }, [updateColor, renderPalette, state.palette]);

  const handleSample = useCallback((hex: string) => {
    if (!samplingColorId) return;
    updateColor(samplingColorId, { hex });
    setSamplingColorId(null);
    renderPalette(undefined, state.palette.map(c => c.id === samplingColorId ? { ...c, hex } : c));
    notifications.show({ message: `Color sampled: ${hex}`, color: 'teal' });
  }, [samplingColorId, updateColor, renderPalette, state.palette, setSamplingColorId]);

  const handleSampleLevels = useCallback((hex: string) => {
    if (!samplingLevels) return;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    const { filterId, point } = samplingLevels;
    const filter = state.filters.find(f => f.id === filterId);
    if (!filter) return;
    const params = filter.params as LevelsParams;
    if (point === 'black') {
      const newBlack = Math.min(luminance, params.whitePoint - 1);
      updateFilter(filterId, { blackPoint: newBlack });
      notifications.show({ message: `Black point set to ${newBlack}`, color: 'dark' });
    } else {
      const newWhite = Math.max(luminance, params.blackPoint + 1);
      updateFilter(filterId, { whitePoint: newWhite });
      notifications.show({ message: `White point set to ${newWhite}`, color: 'gray' });
    }
    setSamplingLevels(null);
  }, [samplingLevels, state.filters, updateFilter, setSamplingLevels]);

  return { handleImageLoad, handleColorChange, handleAddColor, handleDeleteColor, handleToggleHighlight, handleSample, handleSampleLevels };
}
