import { Stack, ActionIcon, Tooltip, Group, Text, Box } from '@mantine/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { FilterInstance, FilterType } from '../../types';
import { FilterItem } from './FilterItem';
import { AddFilterMenu } from './AddFilterMenu';

interface SamplingLevels {
  filterId: string;
  point: 'black' | 'white';
}

interface Props {
  filters: FilterInstance[];
  onAddFilter: (type: FilterType) => void;
  onRemoveFilter: (id: string) => void;
  onUpdateFilter: (id: string, params: Record<string, number>) => void;
  onReorderFilters: (filters: FilterInstance[]) => void;
  samplingLevels: SamplingLevels | null;
  onStartSamplingLevels: (filterId: string, point: 'black' | 'white') => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function FilterPanel({
  filters, onAddFilter, onRemoveFilter, onUpdateFilter, onReorderFilters,
  samplingLevels, onStartSamplingLevels, collapsed, onToggleCollapse,
}: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filters.findIndex(f => f.id === active.id);
    const newIndex = filters.findIndex(f => f.id === over.id);
    onReorderFilters(arrayMove(filters, oldIndex, newIndex));
  }

  if (collapsed) {
    return (
      <Stack align="center" pt="md" gap="xs">
        <Tooltip label="Expand" position="right" transitionProps={{ duration: 0 }}>
          <ActionIcon variant="subtle" onClick={onToggleCollapse} color="gray">
            <ChevronRight size={18} />
          </ActionIcon>
        </Tooltip>
      </Stack>
    );
  }

  return (
    <Stack gap={0} style={{ height: '100%' }}>
      <Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-dark-6)', flexShrink: 0 }}>
        <Text fw={600} size="sm">Filters</Text>
        <Tooltip label="Collapse panel" position="right" transitionProps={{ duration: 0 }}>
          <ActionIcon variant="subtle" onClick={onToggleCollapse} color="gray">
            <ChevronLeft size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
      <Stack gap="xs" p="xs" style={{ flex: 1, overflowY: 'auto' }}>
        <AddFilterMenu onAdd={onAddFilter} />
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filters.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {filters.map(filter => (
              <FilterItem
                key={filter.id}
                filter={filter}
                onRemove={() => onRemoveFilter(filter.id)}
                onUpdate={(params) => onUpdateFilter(filter.id, params)}
                samplingLevels={samplingLevels?.filterId === filter.id ? samplingLevels.point : null}
                onStartSamplingLevels={(point) => onStartSamplingLevels(filter.id, point)}
              />
            ))}
          </SortableContext>
        </DndContext>
        {filters.length === 0 && (
          <Box ta="center" py="xl">
            <Text size="xs" c="dimmed">No filters added yet</Text>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}
