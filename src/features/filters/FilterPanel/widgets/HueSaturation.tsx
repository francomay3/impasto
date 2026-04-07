import { Stack } from '@mantine/core';
import type { HueSaturationParams } from '../../../../types';
import { FilterSlider } from '../FilterSlider';

interface Props {
  params: HueSaturationParams;
  onUpdate: (p: Record<string, number>) => void;
  onPreview: (p: Record<string, number>) => void;
}

export function HueSaturation({ params, onUpdate, onPreview }: Props) {
  return (
    <Stack gap="xs">
      <FilterSlider
        label="Hue"
        value={params.hue}
        min={-180}
        max={180}
        defaultValue={0}
        onChange={(v) => onPreview({ hue: v })}
        onChangeEnd={(v) => onUpdate({ hue: v })}
      />
      <FilterSlider
        label="Saturation"
        value={params.saturation}
        min={-100}
        max={100}
        defaultValue={0}
        onChange={(v) => onPreview({ saturation: v })}
        onChangeEnd={(v) => onUpdate({ saturation: v })}
      />
      <FilterSlider
        label="Lightness"
        value={params.lightness}
        min={-100}
        max={100}
        defaultValue={0}
        onChange={(v) => onPreview({ lightness: v })}
        onChangeEnd={(v) => onUpdate({ lightness: v })}
      />
    </Stack>
  );
}
