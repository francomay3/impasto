import { Stack } from '@mantine/core';
import type { VibranceParams } from '../../../../types';
import { FilterSlider } from '../FilterSlider';

interface Props {
  params: VibranceParams;
  onUpdate: (p: Record<string, number>) => void;
  onPreview: (p: Record<string, number>) => void;
}

export function Vibrance({ params, onUpdate, onPreview }: Props) {
  return (
    <Stack gap="xs">
      <FilterSlider
        label="Vibrance"
        value={params.vibrance}
        min={-100}
        max={100}
        defaultValue={0}
        onChange={(v) => onPreview({ vibrance: v })}
        onChangeEnd={(v) => onUpdate({ vibrance: v })}
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
    </Stack>
  );
}
