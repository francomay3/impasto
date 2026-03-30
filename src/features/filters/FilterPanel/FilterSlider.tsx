import { Stack, Slider, Text, ActionIcon, Group, Tooltip } from '@mantine/core';
import { RotateCcw } from 'lucide-react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  defaultValue: number;
  onChange: (v: number) => void;
  onChangeEnd?: (v: number) => void;
}

export function FilterSlider({ label, value, min, max, defaultValue, onChange, onChangeEnd }: Props) {
  return (
    <Stack gap={2}>
      <Group gap={4} justify="space-between">
        <Text size="xs" c="dimmed">{label}: {value}</Text>
        {value !== defaultValue && (
          <Tooltip label={`Reset ${label}`} transitionProps={{ duration: 0 }}>
            <ActionIcon size="xs" variant="subtle" color="gray" aria-label={`Reset ${label}`} onClick={() => (onChangeEnd ?? onChange)(defaultValue)}>
              <RotateCcw size={10} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
      <Slider value={value} min={min} max={max} onChange={onChange} onChangeEnd={onChangeEnd} size="xs" thumbProps={{ 'aria-label': label }} />
    </Stack>
  );
}
