import { useRef } from 'react';
import { Stack, Box, Text } from '@mantine/core';
import { DndContext, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import type { DragEndEvent } from '@dnd-kit/core';
import { SmartMouseSensor } from '../../utils/dndSensor';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { FilterItem } from './FilterItem';
import { AddItemButton } from '../AddItemButton';
import { useFilterContext } from '../../context/FilterContext';
import { useContextMenu } from '../../context/ContextMenuContext';
import { buildFilterMenuItems } from './filterMenuData';

export function FilterPanel() {
  const { filters, onReorderFilters, onAddFilter } = useFilterContext();
  const { open: openMenu } = useContextMenu();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const sensors = useSensors(useSensor(SmartMouseSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filters.findIndex(f => f.id === active.id);
    const newIndex = filters.findIndex(f => f.id === over.id);
    onReorderFilters(arrayMove(filters, oldIndex, newIndex));
  }

  return (
    <Stack gap="xs" p="xs" data-testid="filter-panel">
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
  );
}
