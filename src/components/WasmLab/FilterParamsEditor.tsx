import { Stack, Slider, Text } from '@mantine/core';
import type { FilterInstance, FilterParams, BrightnessContrastParams, HueSaturationParams, LevelsParams, BlurParams } from '../../types';

type Props = { filter: FilterInstance; onChange: (p: FilterParams) => void };

function LabeledSlider({ label, value, min, max, step = 1, onChange }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">{label}: {value}</Text>
      <Slider min={min} max={max} step={step} value={value} onChange={onChange} size="xs" />
    </Stack>
  );
}

export function FilterParamsEditor({ filter, onChange }: Props) {
  function set(key: string, value: number) {
    onChange({ ...filter.params, [key]: value });
  }

  switch (filter.type) {
    case 'brightness-contrast': {
      const p = filter.params as BrightnessContrastParams;
      return (
        <Stack gap="xs">
          <LabeledSlider label="Brightness" value={p.brightness} min={-150} max={150} onChange={v => set('brightness', v)} />
          <LabeledSlider label="Contrast" value={p.contrast} min={-100} max={100} onChange={v => set('contrast', v)} />
        </Stack>
      );
    }
    case 'hue-saturation': {
      const p = filter.params as HueSaturationParams;
      return (
        <Stack gap="xs">
          <LabeledSlider label="Saturation" value={p.saturation} min={-100} max={100} onChange={v => set('saturation', v)} />
          <LabeledSlider label="Temperature" value={p.temperature} min={-50} max={50} onChange={v => set('temperature', v)} />
          <LabeledSlider label="Tint" value={p.tint} min={-50} max={50} onChange={v => set('tint', v)} />
        </Stack>
      );
    }
    case 'levels': {
      const p = filter.params as LevelsParams;
      return (
        <Stack gap="xs">
          <LabeledSlider label="Black Point" value={p.blackPoint} min={0} max={254} onChange={v => set('blackPoint', v)} />
          <LabeledSlider label="White Point" value={p.whitePoint} min={1} max={255} onChange={v => set('whitePoint', v)} />
        </Stack>
      );
    }
    case 'blur': {
      const p = filter.params as BlurParams;
      return (
        <LabeledSlider label="Radius" value={p.blur} min={0} max={20} onChange={v => set('blur', v)} />
      );
    }
  }
}
