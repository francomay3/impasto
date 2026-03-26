import { useMemo, useState } from 'react';
import { Stack, Title, Text, Group, Button, Select, Paper, ActionIcon, Divider, SimpleGrid } from '@mantine/core';
import { Trash } from 'lucide-react';
import type { FilterInstance, FilterType, FilterParams, RawImage } from '../../types';
import { DEFAULT_FILTER_PARAMS, FILTER_LABELS } from '../../types';
import { FilterParamsEditor } from './FilterParamsEditor';
import { useFilteredImage } from '../../hooks/useFilteredImage';
import { useCanvas } from '../../hooks/useCanvas';

const FILTER_OPTIONS = (Object.keys(FILTER_LABELS) as FilterType[]).map(v => ({ value: v, label: FILTER_LABELS[v] }));
const NO_FILTERS: FilterInstance[] = [];

type Props = { sourceImage: RawImage | null };

export function PipelineSection({ sourceImage }: Props) {
  const [filters, setFilters] = useState<FilterInstance[]>([]);
  const [addType, setAddType] = useState<FilterType>('brightness-contrast');

  const stableFilters = useMemo(() => filters, [filters]);

  const originalData = useFilteredImage(sourceImage, NO_FILTERS);
  const originalRef = useCanvas(originalData);
  const processedData = useFilteredImage(sourceImage, stableFilters);
  const processedRef = useCanvas(processedData);

  function addFilter() {
    setFilters(f => [...f, { id: crypto.randomUUID(), type: addType, params: { ...DEFAULT_FILTER_PARAMS[addType] } }]);
  }

  function removeFilter(id: string) {
    setFilters(f => f.filter(x => x.id !== id));
  }

  function updateParams(id: string, params: FilterParams) {
    setFilters(f => f.map(x => x.id === id ? { ...x, params } : x));
  }

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>useFilteredImage</Title>
        <Text c="dimmed" size="sm">
          Pipeline runs in a Web Worker via Rust/WASM. Backpressured, intermediate results cached per step.
        </Text>
      </Stack>

      {filters.map((f, i) => (
        <Paper key={f.id} p="sm" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>{i + 1}. {FILTER_LABELS[f.type]}</Text>
            <ActionIcon variant="subtle" color="red" onClick={() => removeFilter(f.id)}>
              <Trash size={14} />
            </ActionIcon>
          </Group>
          <FilterParamsEditor filter={f} onChange={p => updateParams(f.id, p)} />
        </Paper>
      ))}

      <Group>
        <Select data={FILTER_OPTIONS} value={addType} onChange={v => v && setAddType(v as FilterType)} style={{ flex: 1 }} />
        <Button variant="light" onClick={addFilter}>Add filter</Button>
      </Group>

      {sourceImage && (
        <>
          <Divider label="Before / After" />
          <SimpleGrid cols={2} spacing="md">
            <Stack gap={4}>
              <Text size="xs" c="dimmed">Original</Text>
              <canvas ref={originalRef} style={{ display: 'block', maxWidth: '100%' }} />
            </Stack>
            <Stack gap={4}>
              <Text size="xs" c="dimmed">Processed</Text>
              <canvas ref={processedRef} style={{ display: 'block', maxWidth: '100%' }} />
            </Stack>
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}
