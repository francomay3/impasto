import type {
  FilterInstance,
  BrightnessContrastParams,
  HueSaturationParams,
  LevelsParams,
  BlurParams,
} from '../../../types';
import { BrightnessContrast } from './widgets/BrightnessContrast';
import { HueSaturation } from './widgets/HueSaturation';
import { Levels } from './widgets/Levels';
import { Blur } from './widgets/Blur';

interface Props {
  filter: FilterInstance;
  onUpdate: (params: Record<string, number>) => void;
  onPreview: (params: Record<string, number>) => void;
  samplingLevels: 'black' | 'white' | null;
  onStartSamplingLevels: (point: 'black' | 'white') => void;
}

export function FilterWidget({
  filter,
  onUpdate,
  onPreview,
  samplingLevels,
  onStartSamplingLevels,
}: Props) {
  switch (filter.type) {
    case 'brightness-contrast':
      return (
        <BrightnessContrast
          params={filter.params as BrightnessContrastParams}
          onUpdate={onUpdate}
          onPreview={onPreview}
        />
      );
    case 'hue-saturation':
      return (
        <HueSaturation
          params={filter.params as HueSaturationParams}
          onUpdate={onUpdate}
          onPreview={onPreview}
        />
      );
    case 'levels':
      return (
        <Levels
          params={filter.params as LevelsParams}
          onUpdate={onUpdate}
          samplingLevels={samplingLevels}
          onStartSamplingLevels={onStartSamplingLevels}
        />
      );
    case 'blur':
      return (
        <Blur params={filter.params as BlurParams} onUpdate={onUpdate} onPreview={onPreview} />
      );
    default:
      return null;
  }
}
