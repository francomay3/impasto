import { useState, useMemo } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Group,
  Button,
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
import { ExportSettingsForm } from './ExportSettingsForm';

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
      await exportPdf(state, filteredCanvasRef.current, indexedCanvasRef.current, effectiveMin, effectiveDelta, selectedPigments, title || state.name);
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
        <TextInput label="PDF title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
        <ExportSettingsForm
          settingsLoading={settingsLoading}
          effectiveMin={effectiveMin}
          effectiveDelta={effectiveDelta}
          pigments={pigments}
          onMinChange={handleMinChange}
          onDeltaChange={handleDeltaChange}
          onPigmentToggle={handlePigmentToggle}
        />
        <Group justify="flex-end" gap="xs">
          <Button variant="subtle" color="gray" onClick={onClose}>Cancel</Button>
          <Button leftSection={<Download size={14} />} onClick={handleExport} loading={exporting}>Export</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
