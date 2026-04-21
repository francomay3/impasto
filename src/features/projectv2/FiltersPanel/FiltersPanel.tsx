import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Box, Stack, Text, ActionIcon, Menu, Tooltip } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useImpastoPipelineFilters } from '../../../engine/hooks/useImpastoPipelineFilters';
import { useImpastoEngine } from '../../../engine/core/ImpastoEngineContext';
import { DEFAULT_FILTER_PARAMS, FILTER_LABELS, type FilterType } from '../../../types';
import { FILTER_GROUPS, FILTER_ICONS } from '../../filters/FilterPanel/filterMenuData';
import { SortableFilterCard } from './FilterCard';

export function FiltersPanel() {
  const filters = useImpastoPipelineFilters();
  const engine = useImpastoEngine();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const addFilter = (type: FilterType) =>
    engine.filters.setFilters([...filters, { id: crypto.randomUUID(), type, params: DEFAULT_FILTER_PARAMS[type], enabled: true }]);
  const toggleFilter = (id: string) =>
    engine.filters.setFilters(filters.map((f) => (f.id === id ? { ...f, enabled: f.enabled === false } : f)));
  const removeFilter = (id: string) => engine.filters.setFilters(filters.filter((f) => f.id !== id));
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = filters.findIndex((f) => f.id === active.id);
    const to = filters.findIndex((f) => f.id === over.id);
    if (from >= 0 && to >= 0) engine.filters.setFilters(arrayMove(filters, from, to));
  };

  return (
    <Stack gap={0} p={8}>
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text size="xs" c="dimmed" fw={500}>Filters</Text>
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <Tooltip label="Add filter" position="left" withArrow>
              <ActionIcon size="sm" variant="subtle" color="gray"><Plus size={14} /></ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            {FILTER_GROUPS.map((group, i) => (
              <div key={group.label}>
                {i > 0 && <Menu.Divider />}
                <Menu.Label>{group.label}</Menu.Label>
                {group.filters.map((type) => (
                  <Menu.Item key={type} leftSection={FILTER_ICONS[type]} onClick={() => addFilter(type)}>{FILTER_LABELS[type]}</Menu.Item>
                ))}
              </div>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Box>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filters.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <Stack gap={4}>
            {filters.map((filter) => (
              <SortableFilterCard
                key={filter.id}
                filter={filter}
                onToggle={() => toggleFilter(filter.id)}
                onRemove={() => removeFilter(filter.id)}
                onUpdate={(partial) =>
                  engine.filters.setFilters(
                    filters.map((f) => (f.id === filter.id ? { ...f, params: { ...f.params, ...partial } } : f)),
                  )
                }
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>
      {filters.length === 0 && <Text size="xs" c="dimmed" ta="center" mt={16}>No filters yet</Text>}
    </Stack>
  );
}
