import { useState } from 'react';
import { Stack, Radio, Group, Checkbox } from '@mantine/core';
import type { ColorBalanceParams } from '../../../../types';
import { FilterSlider } from '../FilterSlider';

type Tone = 'shadows' | 'midtones' | 'highlights';

const TONE_KEYS: Record<Tone, [keyof ColorBalanceParams, keyof ColorBalanceParams, keyof ColorBalanceParams]> = {
  shadows:    ['shadowsR',    'shadowsG',    'shadowsB'],
  midtones:   ['midtonesR',   'midtonesG',   'midtonesB'],
  highlights: ['highlightsR', 'highlightsG', 'highlightsB'],
};

interface Props {
  params: ColorBalanceParams;
  onUpdate: (p: Record<string, number>) => void;
  onPreview: (p: Record<string, number>) => void;
}

export function ColorBalance({ params, onUpdate, onPreview }: Props) {
  const [activeTone, setActiveTone] = useState<Tone>('midtones');
  const [rKey, gKey, bKey] = TONE_KEYS[activeTone];

  return (
    <Stack gap="xs">
      <FilterSlider
        label="Cyan — Red"
        value={params[rKey] as number}
        min={-100}
        max={100}
        defaultValue={0}
        onChange={(v) => onPreview({ [rKey]: v })}
        onChangeEnd={(v) => onUpdate({ [rKey]: v })}
      />
      <FilterSlider
        label="Magenta — Green"
        value={params[gKey] as number}
        min={-100}
        max={100}
        defaultValue={0}
        onChange={(v) => onPreview({ [gKey]: v })}
        onChangeEnd={(v) => onUpdate({ [gKey]: v })}
      />
      <FilterSlider
        label="Yellow — Blue"
        value={params[bKey] as number}
        min={-100}
        max={100}
        defaultValue={0}
        onChange={(v) => onPreview({ [bKey]: v })}
        onChangeEnd={(v) => onUpdate({ [bKey]: v })}
      />
      <Radio.Group value={activeTone} onChange={(v) => setActiveTone(v as Tone)}>
        <Stack gap={4}>
          <Radio value="shadows" label="Shadows" size="xs" />
          <Radio value="midtones" label="Midtones" size="xs" />
          <Radio value="highlights" label="Highlights" size="xs" />
        </Stack>
      </Radio.Group>
      <Checkbox
        label="Preserve Luminosity"
        size="xs"
        checked={params.preserveLuminosity === 1}
        onChange={(e) => onUpdate({ preserveLuminosity: e.currentTarget.checked ? 1 : 0 })}
      />
    </Stack>
  );
}
