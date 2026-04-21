import { Stack, Group, Slider, Text, ActionIcon, Tooltip } from '@mantine/core';
import { RotateCcw } from 'lucide-react';

interface FilterParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  onCommit: (v: number) => void;
}

export function FilterParamSlider({
  label,
  value,
  min,
  max,
  step = 1,
  defaultValue,
  onCommit,
}: FilterParamSliderProps) {
  return (
    <Stack gap={2}>
      <Group gap={4} justify="space-between">
        <Text size="xs" c="dimmed">
          {label}: {value}
        </Text>
        {value !== defaultValue && (
          <Tooltip label={'Reset ' + label} transitionProps={{ duration: 0 }}>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              aria-label={`Reset ${label}`}
              onClick={() => onCommit(defaultValue)}
            >
              <RotateCcw size={10} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        size="xs"
        thumbLabel={label}
        onChange={onCommit}
      />
    </Stack>
  );
}
