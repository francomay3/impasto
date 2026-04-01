import { Stack, Text, NumberInput, Checkbox, SimpleGrid, Group, Box, Skeleton } from '@mantine/core';
import { PIGMENTS } from '../../services/ColorMixer';

interface Props {
  settingsLoading: boolean;
  effectiveMin: number;
  effectiveDelta: number;
  pigments: Set<string>;
  onMinChange: (v: number | string) => void;
  onDeltaChange: (v: number | string) => void;
  onPigmentToggle: (name: string, checked: boolean) => void;
}

export function ExportSettingsForm({
  settingsLoading,
  effectiveMin,
  effectiveDelta,
  pigments,
  onMinChange,
  onDeltaChange,
  onPigmentToggle,
}: Props) {
  return (
    <Skeleton visible={settingsLoading}>
      <Stack gap={4}>
        <Text size="sm" fw={500}>Minimum paint percentage</Text>
        <Text size="xs" c="dimmed">
          Pigments contributing less than this percentage to a mix are dropped. Higher values
          produce simpler recipes; lower values allow more precise matches.
        </Text>
        <NumberInput value={effectiveMin} onChange={onMinChange} min={1} max={20} step={1} suffix="%" size="sm" />
      </Stack>
      <Stack gap={4} mt="xs">
        <Text size="sm" fw={500}>Color accuracy (ΔE)</Text>
        <Text size="xs" c="dimmed">
          How close a mixed color needs to be before the search stops. Lower values demand a
          tighter match. A value of 4 is a practical threshold.
        </Text>
        <NumberInput value={effectiveDelta} onChange={onDeltaChange} min={1} max={30} step={1} size="sm" />
      </Stack>
      <Stack gap={4} mt="xs">
        <Text size="sm" fw={500}>Pigments</Text>
        <Text size="xs" c="dimmed">
          Only checked pigments will be considered when calculating mix recipes.
        </Text>
        <SimpleGrid cols={2} spacing={6} mt={4}>
          {PIGMENTS.map((p) => (
            <Checkbox
              key={p.name}
              size="xs"
              checked={pigments.has(p.name)}
              onChange={(e) => onPigmentToggle(p.name, e.currentTarget.checked)}
              label={
                <Group gap={6} wrap="nowrap">
                  <Box
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: p.rgb,
                      border: '1px solid var(--mantine-color-dark-3)',
                      flexShrink: 0,
                    }}
                  />
                  <Text size="xs">{p.name}</Text>
                </Group>
              }
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Skeleton>
  );
}
