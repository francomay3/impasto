import { useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Group,
  Button,
} from '@mantine/core';
import { Download } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { exportPdf } from '../../services/PdfExport';
import { PIGMENTS } from '../../services/ColorMixer';
import type { ProjectState } from '../../types';
import { useCanvasContext } from '../canvas/CanvasContext';
import { useAuthStore } from '../auth/authStore';
import { ExportSettingsForm } from './ExportSettingsForm';
import { useExportSettingsForm } from './useExportSettingsForm';

interface Props {
  opened: boolean;
  state: ProjectState;
  onClose: () => void;
}

export function ExportModal({ opened, state, onClose }: Props) {
  const { filteredCanvasRef, indexedCanvasRef } = useCanvasContext();
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState(state.name);
  const [exporting, setExporting] = useState(false);

  const {
    settingsLoading,
    effectiveMin,
    effectiveDelta,
    effectivePigmentNames,
    pigments,
    saveMutation,
    handleMinChange,
    handleDeltaChange,
    handlePigmentToggle,
  } = useExportSettingsForm(user?.uid, opened);

  const handleExport = async () => {
    if (!filteredCanvasRef.current || !indexedCanvasRef.current) return;
    setExporting(true);
    try {
      const selectedPigments = PIGMENTS.filter((p) => pigments.has(p.name));
      await exportPdf(state, filteredCanvasRef.current, indexedCanvasRef.current, effectiveMin, effectiveDelta, selectedPigments, title || state.name);
      if (user) saveMutation.mutate({ minPaintPercent: effectiveMin, delta: effectiveDelta, selectedPigmentNames: effectivePigmentNames });
      onClose();
      notifications.show({ message: 'Export complete', color: 'green' });
    } finally {
      setExporting(false);
    }
  };

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
