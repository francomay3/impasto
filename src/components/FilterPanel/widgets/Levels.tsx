import { Stack, Group, Text, Box, ActionIcon, Tooltip, Slider } from '@mantine/core';
import { Pipette, RotateCcw } from 'lucide-react';
import type { LevelsParams } from '../../../types';

interface LevelPointProps {
  label: string;
  value: number;
  isDefault: boolean;
  isSampling: boolean;
  min: number;
  max: number;
  onUpdate: (value: number) => void;
  onSample: () => void;
  onReset: () => void;
}

function LevelPoint({ label, value, isDefault, isSampling, min, max, onUpdate, onSample, onReset }: LevelPointProps) {
  const shade = Math.round(value);
  return (
    <Stack gap={4}>
      <Group gap={6} wrap="nowrap" align="center">
        <Box style={{ width: 16, height: 16, borderRadius: 3, background: `rgb(${shade},${shade},${shade})`, border: '1px solid var(--mantine-color-dark-3)', flexShrink: 0 }} />
        <Text size="xs" c="dimmed" style={{ flex: 1 }}>{label}: {value}</Text>
        <Tooltip label={`Sample ${label} from image`} transitionProps={{ duration: 0 }}>
          <ActionIcon size="xs" variant={isSampling ? 'filled' : 'subtle'} color={isSampling ? 'cyan' : 'gray'} onClick={onSample}>
            <Pipette size={10} />
          </ActionIcon>
        </Tooltip>
        {!isDefault && (
          <Tooltip label={`Reset ${label}`} transitionProps={{ duration: 0 }}>
            <ActionIcon size="xs" variant="subtle" color="gray" onClick={onReset}>
              <RotateCcw size={10} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
      <Slider value={value} min={min} max={max} onChange={onUpdate} size="xs" />
    </Stack>
  );
}

interface Props {
  params: LevelsParams;
  onUpdate: (p: Record<string, number>) => void;
  samplingLevels: 'black' | 'white' | null;
  onStartSamplingLevels: (point: 'black' | 'white') => void;
}

export function Levels({ params, onUpdate, samplingLevels, onStartSamplingLevels }: Props) {
  return (
    <Stack gap="xs">
      <LevelPoint
        label="Black Point" value={params.blackPoint} isDefault={params.blackPoint === 0}
        min={0} max={params.whitePoint - 1}
        isSampling={samplingLevels === 'black'} onSample={() => onStartSamplingLevels('black')}
        onUpdate={(v) => onUpdate({ blackPoint: v })} onReset={() => onUpdate({ blackPoint: 0 })}
      />
      <LevelPoint
        label="White Point" value={params.whitePoint} isDefault={params.whitePoint === 255}
        min={params.blackPoint + 1} max={255}
        isSampling={samplingLevels === 'white'} onSample={() => onStartSamplingLevels('white')}
        onUpdate={(v) => onUpdate({ whitePoint: v })} onReset={() => onUpdate({ whitePoint: 255 })}
      />
    </Stack>
  );
}
