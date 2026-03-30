import { Stack } from '@mantine/core';
import type { BrightnessContrastParams } from '../../../types';
import { FilterSlider } from '../FilterSlider';

interface Props {
  params: BrightnessContrastParams;
  onUpdate: (p: Record<string, number>) => void;
  onPreview: (p: Record<string, number>) => void;
}

export function BrightnessContrast({ params, onUpdate, onPreview }: Props) {
  return (
    <Stack gap="xs">
      <FilterSlider label="Brightness" value={params.brightness} min={-100} max={100} defaultValue={0}
        onChange={(v) => onPreview({ brightness: v })} onChangeEnd={(v) => onUpdate({ brightness: v })} />
      <FilterSlider label="Contrast" value={params.contrast} min={-100} max={100} defaultValue={0}
        onChange={(v) => onPreview({ contrast: v })} onChangeEnd={(v) => onUpdate({ contrast: v })} />
    </Stack>
  );
}
