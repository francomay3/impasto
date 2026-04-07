import { useState } from 'react';
import { Stack, Text } from '@mantine/core';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableColorItem } from './ColorItem';
import { GroupDropZone } from './GroupDropZone';
import { SortableGroup } from './SortableGroup';
import { PaletteSidebarHeader } from './PaletteSidebarHeader';
import { usePaletteDnd } from './usePaletteDnd';
import { useSortPalette } from './useSortPalette';
import { usePaletteContext } from '../PaletteContext';
import { useEditorStore } from '../../editor/editorStore';
import { createGroupEntry, getUngroupedColors } from '../paletteUtils';

export function PaletteSidebar() {
  const {
    palette,
    groups,
    onAddColor,
    onAddGroup,
    onRemoveGroup,
    onRenameGroup,
    onReorderPalette,
    onReorderGroups,
  } = usePaletteContext();
  const selectColor = useEditorStore(s => s.selectColor);
  const sortPalette = useSortPalette();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [newGroupId, setNewGroupId] = useState<string | null>(null);

  const handleAddGroup = () => {
    const { id, name } = createGroupEntry(groups.length);
    onAddGroup(id, name);
    setNewGroupId(id);
  };

  const {
    sensors,
    collisionDetection,
    displayPalette,
    draggingType,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = usePaletteDnd({
    palette,
    groups,
    onReorderGroups,
    onReorderPalette,
  });

  const toggleCollapse = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const ungroupedColors = getUngroupedColors(displayPalette, groups);
  const isDraggingColor = draggingType === 'color';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <Stack gap="xs" p="xs" onClick={() => selectColor(null)} data-testid="palette-sidebar">
        <PaletteSidebarHeader
          onAddColor={onAddColor}
          onAddGroup={handleAddGroup}
          onSort={sortPalette}
        />

        <SortableContext items={groups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          <Stack gap={6}>
            {groups.map((group) => {
              const groupColors = displayPalette.filter((c) => c.groupId === group.id);
              return (
                <SortableGroup
                  key={group.id}
                  group={group}
                  collapsed={collapsedGroups.has(group.id)}
                  isDraggingColor={isDraggingColor}
                  autoEdit={group.id === newGroupId}
                  showDragHandle={groups.length > 1}
                  colorCount={groupColors.length}
                  sampleColorIds={groupColors.filter((c) => c.sample).map((c) => c.id)}
                  onToggleCollapse={() => toggleCollapse(group.id)}
                  onRename={(name) => onRenameGroup(group.id, name)}
                  onDelete={() => onRemoveGroup(group.id)}
                >
                  <SortableContext
                    items={groupColors.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Stack gap={4}>
                      {groupColors.map((color) => (
                        <SortableColorItem
                          key={color.id}
                          color={color}
                          index={displayPalette.indexOf(color)}
                        />
                      ))}
                    </Stack>
                  </SortableContext>
                </SortableGroup>
              );
            })}
          </Stack>
        </SortableContext>

        {groups.length > 0 && (
          <Text size="xs" c="dimmed" fw={500} style={{ marginTop: 4 }}>
            Ungrouped
          </Text>
        )}

        {groups.length === 0 || ungroupedColors.length > 0 ? (
          <SortableContext
            items={ungroupedColors.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack gap={4}>
              {ungroupedColors.map((color) => (
                <SortableColorItem
                  key={color.id}
                  color={color}
                  index={displayPalette.indexOf(color)}
                />
              ))}
            </Stack>
          </SortableContext>
        ) : (
          groups.length > 0 && (
            <GroupDropZone groupId={undefined} isDraggingColor={isDraggingColor} />
          )
        )}
      </Stack>
    </DndContext>
  );
}
