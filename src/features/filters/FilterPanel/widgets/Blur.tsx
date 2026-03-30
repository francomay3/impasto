import { Stack } from '@mantine/core';
import type { BlurParams } from '../../../../types';
import { FilterSlider } from '../FilterSlider';

interface Props {
  params: BlurParams;
  onUpdate: (p: Record<string, number>) => void;
  onPreview: (p: Record<string, number>) => void;
}

export function Blur({ params, onUpdate, onPreview }: Props) {
  return (
    <Stack gap="xs">
      <FilterSlider
        label="Blur"
        value={params.blur}
        min={0}
        max={50}
        defaultValue={0}
        onChange={(v) => onPreview({ blur: v })}
        onChangeEnd={(v) => onUpdate({ blur: v })}
      />
    </Stack>
  );
}
