import { Stack } from '@mantine/core';
import type { HueSaturationParams } from '../../../types';
import { FilterSlider } from '../FilterSlider';

interface Props {
  params: HueSaturationParams;
  onUpdate: (p: Record<string, number>) => void;
}

export function HueSaturation({ params, onUpdate }: Props) {
  return (
    <Stack gap="xs">
      <FilterSlider label="Saturation" value={params.saturation} min={-100} max={100} defaultValue={0} onChange={(v) => onUpdate({ saturation: v })} />
      <FilterSlider label="Temperature" value={params.temperature} min={-50} max={50} defaultValue={0} onChange={(v) => onUpdate({ temperature: v })} />
      <FilterSlider label="Tint" value={params.tint} min={-50} max={50} defaultValue={0} onChange={(v) => onUpdate({ tint: v })} />
    </Stack>
  );
}
