import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import { notifications } from '@mantine/notifications';
import type { Color, ColorSample, FilterInstance, LevelsParams } from '../../types';
import { sampleCircleAverage } from '../../utils/imageProcessing';
import { rgbToHex } from '../../utils/colorUtils';
import type { SamplingLevels } from '../filters/FilterContext';

interface Options {
  pendingNewColorIdRef: MutableRefObject<string | null>;
  lastImageDataRef: MutableRefObject<ImageData | null>;
  samplingColorId: string | null;
  samplingLevels: SamplingLevels | null;
  completeSample: () => void;
  cancelSample: () => void;
  palette: Color[];
  filters: FilterInstance[];
  updateColor: (id: string, changes: Partial<Color>) => void;
  updateFilter: (id: string, params: Record<string, number>) => void;
  removeColor: (id: string) => void;
  setPalette: (palette: Color[]) => void;
}

export function useColorSamplingHandlers({
  pendingNewColorIdRef,
  lastImageDataRef,
  samplingColorId,
  samplingLevels,
  completeSample,
  cancelSample,
  palette,
  filters,
  updateColor,
  updateFilter,
  removeColor,
  setPalette,
}: Options) {
  const handleSample = useCallback(
    (sample: ColorSample, hex: string) => {
      if (!samplingColorId) return;
      pendingNewColorIdRef.current = null;
      updateColor(samplingColorId, { hex, sample });
      completeSample();
      notifications.show({ message: `Color sampled: ${hex}`, color: 'primary' });
    },
    [samplingColorId, updateColor, completeSample, pendingNewColorIdRef]
  );

  const handleCancelSample = useCallback(() => {
    if (samplingColorId && samplingColorId === pendingNewColorIdRef.current) {
      removeColor(samplingColorId);
    }
    pendingNewColorIdRef.current = null;
    cancelSample();
  }, [samplingColorId, removeColor, cancelSample, pendingNewColorIdRef]);

  const handleSampleLevels = useCallback(
    (_sample: ColorSample, hex: string) => {
      if (!samplingLevels) return;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      const { filterId, point } = samplingLevels;
      const filter = filters.find((f) => f.id === filterId);
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
      completeSample();
    },
    [samplingLevels, filters, updateFilter, completeSample]
  );

  const handlePinMoveEnd = useCallback(
    (colorId: string, sample: ColorSample) => {
      const imageData = lastImageDataRef.current;
      if (!imageData) return;
      updateColor(colorId, { sample });
      const newPalette = palette.map((c) => {
        const s = c.id === colorId ? sample : c.sample;
        if (!s) return c;
        const [r, g, b] = sampleCircleAverage(imageData, s.x, s.y, s.radius);
        return { ...c, hex: rgbToHex(r, g, b), ...(c.id === colorId ? { sample } : {}) };
      });
      setPalette(newPalette);
    },
    [updateColor, setPalette, palette, lastImageDataRef]
  );

  return { handleSample, handleCancelSample, handleSampleLevels, handlePinMoveEnd };
}
