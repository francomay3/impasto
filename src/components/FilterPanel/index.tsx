import { useRef } from 'react';
import { Stack, ActionIcon, Tooltip, Group, Text, Box } from '@mantine/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DndContext, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import type { DragEndEvent } from '@dnd-kit/core';
import { SmartPointerSensor } from '../../utils/dndSensor';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { FilterItem } from './FilterItem';
import { AddItemButton } from '../AddItemButton';
import { useFilterContext } from '../../context/FilterContext';
import { useContextMenu } from '../../context/ContextMenuContext';
import { buildFilterMenuItems } from './AddFilterMenu';

interface Props {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function FilterPanel({ collapsed, onToggleCollapse }: Props) {
  const { filters, onReorderFilters, onAddFilter } = useFilterContext();
  const { open: openMenu } = useContextMenu();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const sensors = useSensors(useSensor(SmartPointerSensor, { activationConstraint: { distance: 5 } }));

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
      <Stack gap="xs" p="xs" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <AddItemButton
          ref={addButtonRef}
          label="Add Filter"
          hint="⌘F"
          onClick={() => {
            const rect = addButtonRef.current?.getBoundingClientRect();
            if (rect) openMenu({ x: rect.left, y: rect.bottom, items: buildFilterMenuItems(onAddFilter) });
          }}
        />
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
          <SortableContext items={filters.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {filters.map(filter => <FilterItem key={filter.id} filter={filter} />)}
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
