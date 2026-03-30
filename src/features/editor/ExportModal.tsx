import { useState } from 'react';
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
} from '@mantine/core';
import { Download } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { exportPdf } from '../../services/PdfExport';
import {
  DEFAULT_MIX_GRANULARITY,
  DEFAULT_DELTA_THRESHOLD,
  PIGMENTS,
} from '../../services/ColorMixer';
import type { ProjectState } from '../../types';
import { useCanvasContext } from '../canvas/CanvasContext';

interface Props {
  opened: boolean;
  state: ProjectState;
  onClose: () => void;
}

export function ExportModal({ opened, state, onClose }: Props) {
  const { filteredCanvasRef, indexedCanvasRef } = useCanvasContext();
  const [title, setTitle] = useState(state.name);
  const [granularity, setGranularity] = useState(DEFAULT_MIX_GRANULARITY);
  const [delta, setDelta] = useState(DEFAULT_DELTA_THRESHOLD);
  const [pigments, setPigments] = useState<Set<string>>(() => new Set(PIGMENTS.map((p) => p.name)));

  const handleExport = () => {
    if (!filteredCanvasRef.current || !indexedCanvasRef.current) return;
    const selectedPigments = PIGMENTS.filter((p) => pigments.has(p.name));
    exportPdf(
      state,
      filteredCanvasRef.current,
      indexedCanvasRef.current,
      granularity,
      delta,
      selectedPigments,
      title || state.name
    );
    onClose();
    notifications.show({ message: 'Export complete', color: 'green' });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Export PDF" size="lg">
      <Stack gap="md">
        <TextInput
          label="PDF title"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
        />
        <Stack gap={4}>
          <Text size="sm" fw={500}>
            Mix granularity
          </Text>
          <Text size="xs" c="dimmed">
            How many equal parts the palette is divided into when calculating paint ratios. Higher
            values give more precise proportions but take longer to compute. 12 is a good balance.
          </Text>
          <NumberInput
            value={granularity}
            onChange={(v) => setGranularity(Number(v))}
            min={4}
            max={24}
            step={1}
            size="sm"
          />
        </Stack>
        <Stack gap={4}>
          <Text size="sm" fw={500}>
            Color accuracy (ΔE)
          </Text>
          <Text size="xs" c="dimmed">
            How close a mixed color needs to be before the search stops. Lower values demand a
            tighter match. A value of 6 is a practical threshold.
          </Text>
          <NumberInput
            value={delta}
            onChange={(v) => setDelta(Number(v))}
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
                onChange={(e) => {
                  const checked = e.currentTarget.checked;
                  setPigments((prev) => {
                    const next = new Set(prev);
                    if (checked) next.add(p.name);
                    else next.delete(p.name);
                    return next;
                  });
                }}
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
        <Group justify="flex-end" gap="xs">
          <Button variant="subtle" color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button leftSection={<Download size={14} />} onClick={handleExport}>
            Export
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
