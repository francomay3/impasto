import { Stack, Text, NumberInput, Checkbox, Box, Divider, Group } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../auth/authStore';
import { useExportSettings } from '../../editor/useExportSettings';
import { PIGMENTS } from '../../../services/ColorMixer';
import { saveExportSettings, type ExportSettings } from '../../../services/FirestoreService';
import { queryKeys } from '../../../lib/queryKeys';

export function PigmentsPanel() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { pigments: selectedPigments, minPaintPercent, delta } = useExportSettings();
  const selectedNames = new Set(selectedPigments.map((p) => p.name));

  const saveMutation = useMutation({
    mutationFn: (settings: ExportSettings) => saveExportSettings(user!.uid, settings),
  });

  function update(patch: Partial<ExportSettings>) {
    const next: ExportSettings = {
      minPaintPercent,
      delta,
      selectedPigmentNames: [...selectedNames],
      ...patch,
    };
    queryClient.setQueryData(queryKeys.exportSettings(user?.uid ?? ''), next);
    if (user) saveMutation.mutate(next);
  }

  function togglePigment(name: string, checked: boolean) {
    const next = new Set(selectedNames);
    if (checked) next.add(name); else next.delete(name);
    update({ selectedPigmentNames: [...next] });
  }

  return (
    <Stack gap="xs" p="xs">
      <Text size="xs" c="dimmed" fw={500}>Mix Settings</Text>

      <Stack gap={4}>
        <Text size="xs" c="dimmed">Min paint %</Text>
        <NumberInput
          size="xs"
          value={minPaintPercent}
          onChange={(v) => typeof v === 'number' && update({ minPaintPercent: v })}
          min={1}
          max={20}
          step={1}
          suffix="%"
        />
      </Stack>

      <Stack gap={4}>
        <Text size="xs" c="dimmed">Delta (ΔE)</Text>
        <NumberInput
          size="xs"
          value={delta}
          onChange={(v) => typeof v === 'number' && update({ delta: v })}
          min={1}
          max={30}
          step={1}
        />
      </Stack>

      <Divider />

      <Text size="xs" c="dimmed" fw={500}>Pigments</Text>
      <Stack gap={4}>
        {PIGMENTS.map((p) => (
          <Checkbox
            key={p.name}
            size="xs"
            checked={selectedNames.has(p.name)}
            onChange={(e) => togglePigment(p.name, e.currentTarget.checked)}
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
    </Stack>
  );
}
