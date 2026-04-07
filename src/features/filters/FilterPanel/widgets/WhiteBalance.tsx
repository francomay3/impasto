import { Stack } from '@mantine/core';
import type { WhiteBalanceParams } from '../../../../types';
import { FilterSlider } from '../FilterSlider';

interface Props {
  params: WhiteBalanceParams;
  onUpdate: (p: Record<string, number>) => void;
  onPreview: (p: Record<string, number>) => void;
}

export function WhiteBalance({ params, onUpdate, onPreview }: Props) {
  return (
    <Stack gap="xs">
      <FilterSlider
        label="Temperature"
        value={params.temperature}
        min={-50}
        max={50}
        defaultValue={0}
        onChange={(v) => onPreview({ temperature: v })}
        onChangeEnd={(v) => onUpdate({ temperature: v })}
      />
      <FilterSlider
        label="Tint"
        value={params.tint}
        min={-50}
        max={50}
        defaultValue={0}
        onChange={(v) => onPreview({ tint: v })}
        onChangeEnd={(v) => onUpdate({ tint: v })}
      />
    </Stack>
  );
}
