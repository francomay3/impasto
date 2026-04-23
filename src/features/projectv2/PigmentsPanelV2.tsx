import { Stack, Text, NumberInput, Checkbox, Box, Divider, Group, Switch } from '@mantine/core';
import { PIGMENTS } from '../../services/ColorMixer';
import { useProjectPigments } from './pigments/useProjectPigments';
import type { ProjectPigmentsState } from '../../storage/ProjectPigmentsState';
import type { PigmentSettings } from '../../storage/impastoProjectDto';

function MixSettingsFields({
  settings,
  state,
}: {
  settings: PigmentSettings;
  state: ProjectPigmentsState;
}) {
  return (
    <>
      <Stack gap={4}>
        <Text size="xs" c="dimmed">Min paint %</Text>
        <NumberInput
          size="xs"
          value={settings.minPaintPercent}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => {
            if (typeof v === 'number') state.setMinPaintPercent(v);
          }}
        />
      </Stack>
      <Stack gap={4}>
        <Text size="xs" c="dimmed">Delta (ΔE)</Text>
        <NumberInput
          size="xs"
          value={settings.deltaThreshold}
          min={0}
          onChange={(v) => {
            if (typeof v === 'number') state.setDeltaThreshold(v);
          }}
        />
      </Stack>
    </>
  );
}

function PigmentList({
  enabledNames,
  state,
}: {
  enabledNames: string[];
  state: ProjectPigmentsState;
}) {
  const enabledSet = new Set(enabledNames);
  return (
    <Stack gap={4}>
      {PIGMENTS.map((p) => (
        <Checkbox
          key={p.name}
          size="xs"
          checked={enabledSet.has(p.name)}
          onChange={(e) => state.togglePigment(p.name, e.currentTarget.checked)}
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
    </Stack>
  );
}

export function PigmentsPanelV2() {
  const { settings, pigmentsState } = useProjectPigments();

  return (
    <Stack gap="xs" p="xs">
      <Switch
        size="xs"
        label="Use pigment-matched colors"
        description="Use closest achievable mix from enabled pigments"
        checked={settings.usePigmentMatchedColors}
        onChange={(e) => pigmentsState.setUsePigmentMatchedColors(e.currentTarget.checked)}
      />
      <Divider />
      <Text size="xs" c="dimmed" fw={500}>Mix Settings</Text>
      <MixSettingsFields settings={settings} state={pigmentsState} />
      <Divider />
      <Text size="xs" c="dimmed" fw={500}>Pigments</Text>
      <PigmentList enabledNames={settings.enabledNames} state={pigmentsState} />
    </Stack>
  );
}
