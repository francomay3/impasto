import { Checkbox, Radio, Stack } from '@mantine/core';
import { useState } from 'react';
import type {
  BlurParams,
  BrightnessContrastParams,
  ColorBalanceParams,
  FilterInstance,
  HueSaturationParams,
  LevelsParams,
  VibranceParams,
  WhiteBalanceParams,
} from '../../../types';
import { FilterParamSlider } from './FilterParamSlider';

interface FilterWidgetDispatchProps {
  filter: FilterInstance;
  onCommit: (partial: Record<string, number>) => void;
}

const TONE_KEYS = {
  shadows: ['shadowsR', 'shadowsG', 'shadowsB'],
  midtones: ['midtonesR', 'midtonesG', 'midtonesB'],
  highlights: ['highlightsR', 'highlightsG', 'highlightsB'],
} as const;

type Tone = keyof typeof TONE_KEYS;

function BrightnessContrast({ p, onCommit }: { p: BrightnessContrastParams; onCommit: FilterWidgetDispatchProps['onCommit'] }) {
  return (
    <Stack gap="xs">
      <FilterParamSlider label="Brightness" value={p.brightness} min={-100} max={100} defaultValue={0} onCommit={(v) => onCommit({ brightness: v })} />
      <FilterParamSlider label="Contrast" value={p.contrast} min={-100} max={100} defaultValue={0} onCommit={(v) => onCommit({ contrast: v })} />
    </Stack>
  );
}

function HueSaturation({ p, onCommit }: { p: HueSaturationParams; onCommit: FilterWidgetDispatchProps['onCommit'] }) {
  return (
    <Stack gap="xs">
      <FilterParamSlider label="Hue" value={p.hue} min={-180} max={180} defaultValue={0} onCommit={(v) => onCommit({ hue: v })} />
      <FilterParamSlider label="Saturation" value={p.saturation} min={-100} max={100} defaultValue={0} onCommit={(v) => onCommit({ saturation: v })} />
      <FilterParamSlider label="Lightness" value={p.lightness} min={-100} max={100} defaultValue={0} onCommit={(v) => onCommit({ lightness: v })} />
    </Stack>
  );
}

function WhiteBalance({ p, onCommit }: { p: WhiteBalanceParams; onCommit: FilterWidgetDispatchProps['onCommit'] }) {
  return (
    <Stack gap="xs">
      <FilterParamSlider label="Temperature" value={p.temperature} min={-50} max={50} defaultValue={0} onCommit={(v) => onCommit({ temperature: v })} />
      <FilterParamSlider label="Tint" value={p.tint} min={-50} max={50} defaultValue={0} onCommit={(v) => onCommit({ tint: v })} />
    </Stack>
  );
}

function Vibrance({ p, onCommit }: { p: VibranceParams; onCommit: FilterWidgetDispatchProps['onCommit'] }) {
  return (
    <Stack gap="xs">
      <FilterParamSlider label="Vibrance" value={p.vibrance} min={-100} max={100} defaultValue={0} onCommit={(v) => onCommit({ vibrance: v })} />
      <FilterParamSlider label="Saturation" value={p.saturation} min={-100} max={100} defaultValue={0} onCommit={(v) => onCommit({ saturation: v })} />
    </Stack>
  );
}

function Levels({ p, onCommit }: { p: LevelsParams; onCommit: FilterWidgetDispatchProps['onCommit'] }) {
  return (
    <Stack gap="xs">
      <FilterParamSlider label="Black Point" value={p.blackPoint} min={0} max={Math.max(0, p.whitePoint - 1)} defaultValue={0} onCommit={(v) => onCommit({ blackPoint: v })} />
      <FilterParamSlider label="White Point" value={p.whitePoint} min={p.blackPoint + 1} max={255} defaultValue={255} onCommit={(v) => onCommit({ whitePoint: v })} />
    </Stack>
  );
}

function Blur({ p, onCommit }: { p: BlurParams; onCommit: FilterWidgetDispatchProps['onCommit'] }) {
  return <FilterParamSlider label="Blur" value={p.blur} min={0} max={50} defaultValue={0} onCommit={(v) => onCommit({ blur: v })} />;
}

function ColorBalance({ p, onCommit }: { p: ColorBalanceParams; onCommit: FilterWidgetDispatchProps['onCommit'] }) {
  const [tone, setTone] = useState<Tone>('midtones');
  const [rk, gk, bk] = TONE_KEYS[tone];
  return (
    <Stack gap="xs">
      <FilterParamSlider label="Cyan-Red" value={p[rk]} min={-100} max={100} defaultValue={0} onCommit={(v) => onCommit({ [rk]: v })} />
      <FilterParamSlider label="Magenta-Green" value={p[gk]} min={-100} max={100} defaultValue={0} onCommit={(v) => onCommit({ [gk]: v })} />
      <FilterParamSlider label="Yellow-Blue" value={p[bk]} min={-100} max={100} defaultValue={0} onCommit={(v) => onCommit({ [bk]: v })} />
      <Radio.Group value={tone} onChange={(v) => setTone(v as Tone)}>
        <Stack gap={4}>
          <Radio value="shadows" label="Shadows" size="xs" />
          <Radio value="midtones" label="Midtones" size="xs" />
          <Radio value="highlights" label="Highlights" size="xs" />
        </Stack>
      </Radio.Group>
      <Checkbox label="Preserve Luminosity" size="xs" checked={p.preserveLuminosity === 1} onChange={(e) => onCommit({ preserveLuminosity: e.currentTarget.checked ? 1 : 0 })} />
    </Stack>
  );
}

export function FilterWidgetDispatch({ filter, onCommit }: FilterWidgetDispatchProps) {
  switch (filter.type) {
    case 'brightness-contrast':
      return <BrightnessContrast p={filter.params as BrightnessContrastParams} onCommit={onCommit} />;
    case 'hue-saturation':
      return <HueSaturation p={filter.params as HueSaturationParams} onCommit={onCommit} />;
    case 'white-balance':
      return <WhiteBalance p={filter.params as WhiteBalanceParams} onCommit={onCommit} />;
    case 'vibrance':
      return <Vibrance p={filter.params as VibranceParams} onCommit={onCommit} />;
    case 'levels':
      return <Levels p={filter.params as LevelsParams} onCommit={onCommit} />;
    case 'blur':
      return <Blur p={filter.params as BlurParams} onCommit={onCommit} />;
    case 'color-balance':
      return <ColorBalance p={filter.params as ColorBalanceParams} onCommit={onCommit} />;
    default:
      return null;
  }
}
