import { useState, useMemo } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Text,
  NumberInput,
  SimpleGrid,
  Checkbox,
  Group,
  Button,
  Box,
  Skeleton,
} from '@mantine/core';
import { Download } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exportPdf } from '../../services/PdfExport';
import { PIGMENTS } from '../../services/ColorMixer';
import { DEFAULT_MIN_PAINT_PERCENT, DEFAULT_DELTA_THRESHOLD } from '../../services/ColorMixer';
import type { ProjectState } from '../../types';
import { useCanvasContext } from '../canvas/CanvasContext';
import { useAuthStore } from '../auth/authStore';
import { loadExportSettings, saveExportSettings } from '../../services/FirestoreService';
import { queryKeys } from '../../lib/queryKeys';

interface Props {
  opened: boolean;
  state: ProjectState;
  onClose: () => void;
}

const ALL_PIGMENT_NAMES = PIGMENTS.map((p) => p.name);

export function ExportModal({ opened, state, onClose }: Props) {
  const { filteredCanvasRef, indexedCanvasRef } = useCanvasContext();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: savedSettings, isLoading: settingsLoading } = useQuery({
    queryKey: queryKeys.exportSettings(user?.uid ?? ''),
    queryFn: () => loadExportSettings(user!.uid),
    enabled: !!user && opened,
    staleTime: Infinity,
  });

  const [minPaintPercent, setMinPaintPercent] = useState(DEFAULT_MIN_PAINT_PERCENT);
  const [delta, setDelta] = useState(DEFAULT_DELTA_THRESHOLD);
  const [selectedPigmentNames, setSelectedPigmentNames] = useState<string[]>(ALL_PIGMENT_NAMES);
  const [title, setTitle] = useState(state.name);

  // Sync local state from query result when it arrives
  const resolved = savedSettings ?? null;
  const effectiveMin = resolved?.minPaintPercent ?? minPaintPercent;
  const effectiveDelta = resolved?.delta ?? delta;
  const effectivePigmentNames = resolved?.selectedPigmentNames ?? selectedPigmentNames;
  const pigments = useMemo(() => new Set(effectivePigmentNames), [effectivePigmentNames]);

  const saveMutation = useMutation({
    mutationFn: (settings: { minPaintPercent: number; delta: number; selectedPigmentNames: string[] }) =>
      saveExportSettings(user!.uid, settings),
    onSuccess: (_, settings) => {
      queryClient.setQueryData(queryKeys.exportSettings(user!.uid), settings);
    },
    onError: () => {
      notifications.show({ message: 'Failed to save export settings', color: 'red' });
    },
  });

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!filteredCanvasRef.current || !indexedCanvasRef.current) return;
    setExporting(true);
    try {
      const selectedPigments = PIGMENTS.filter((p) => pigments.has(p.name));
      await exportPdf(
        state,
        filteredCanvasRef.current,
        indexedCanvasRef.current,
        effectiveMin,
        effectiveDelta,
        selectedPigments,
        title || state.name
      );
      if (user) {
        saveMutation.mutate({ minPaintPercent: effectiveMin, delta: effectiveDelta, selectedPigmentNames: effectivePigmentNames });
      }
      onClose();
      notifications.show({ message: 'Export complete', color: 'green' });
    } finally {
      setExporting(false);
    }
  };

  function handleMinChange(v: number | string) {
    const n = Number(v);
    setMinPaintPercent(n || effectiveMin);
    if (resolved) queryClient.setQueryData(queryKeys.exportSettings(user!.uid), { ...resolved, minPaintPercent: n || effectiveMin });
  }

  function handleDeltaChange(v: number | string) {
    const n = Number(v);
    setDelta(n || effectiveDelta);
    if (resolved) queryClient.setQueryData(queryKeys.exportSettings(user!.uid), { ...resolved, delta: n || effectiveDelta });
  }

  function handlePigmentToggle(name: string, checked: boolean) {
    const next = new Set(pigments);
    if (checked) next.add(name); else next.delete(name);
    const names = [...next];
    setSelectedPigmentNames(names);
    if (resolved) queryClient.setQueryData(queryKeys.exportSettings(user!.uid), { ...resolved, selectedPigmentNames: names });
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Export PDF" size="lg">
      <Stack gap="md">
        <TextInput
          label="PDF title"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
        />
        <Skeleton visible={settingsLoading}>
        <Stack gap={4}>
          <Text size="sm" fw={500}>
            Minimum paint percentage
          </Text>
          <Text size="xs" c="dimmed">
            Pigments contributing less than this percentage to a mix are dropped. Higher values
            produce simpler recipes; lower values allow more precise matches.
          </Text>
          <NumberInput
            value={effectiveMin}
            onChange={handleMinChange}
            min={1}
            max={20}
            step={1}
            suffix="%"
            size="sm"
          />
        </Stack>
        <Stack gap={4}>
          <Text size="sm" fw={500}>
            Color accuracy (ΔE)
          </Text>
          <Text size="xs" c="dimmed">
            How close a mixed color needs to be before the search stops. Lower values demand a
            tighter match. A value of 4 is a practical threshold.
          </Text>
          <NumberInput
            value={effectiveDelta}
            onChange={handleDeltaChange}
            min={1}
            max={30}
            step={1}
            size="sm"
          />
        </Stack>
        <Stack gap={4}>
          <Text size="sm" fw={500}>
            Pigments
          </Text>
          <Text size="xs" c="dimmed">
            Only checked pigments will be considered when calculating mix recipes.
          </Text>
          <SimpleGrid cols={2} spacing={6} mt={4}>
            {PIGMENTS.map((p) => (
              <Checkbox
                key={p.name}
                size="xs"
                checked={pigments.has(p.name)}
                onChange={(e) => handlePigmentToggle(p.name, e.currentTarget.checked)}
                label={
                  <Group gap={6} wrap="nowrap">
                    <Box
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: p.hex,
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
        <Group justify="flex-end" gap="xs">
          <Button variant="subtle" color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button leftSection={<Download size={14} />} onClick={handleExport} loading={exporting}>
            Export
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
