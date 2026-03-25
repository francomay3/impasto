import { useState, useCallback } from 'react';
import { Stack, Box, Text, ActionIcon, Tooltip } from '@mantine/core';
import { FolderPlus } from 'lucide-react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AddItemButton } from '../AddItemButton';
import { ColorItem, SortableColorItem } from './ColorItem';
import { GroupDropZone } from './GroupDropZone';
import { SortableGroup } from './SortableGroup';
import { usePaletteDnd } from './usePaletteDnd';
import { usePaletteContext } from '../../context/PaletteContext';

export function PaletteSidebar() {
  const {
    palette, groups, onAddColor,
    onAddGroup: ctxAddGroup, onRemoveGroup, onRenameGroup,
    onSetColorGroup, onReorderPalette, onReorderGroups,
  } = usePaletteContext();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [newGroupId, setNewGroupId] = useState<string | null>(null);

  const handleAddGroup = useCallback((id: string, name: string) => {
    ctxAddGroup(id, name);
    setNewGroupId(id);
  }, [ctxAddGroup]);

  const { sensors, collisionDetection, draggingType, handleDragStart, handleDragEnd } = usePaletteDnd({
    palette, groups, onReorderGroups, onSetColorGroup, onReorderPalette,
  });

  const toggleCollapse = (id: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const ungroupedColors = palette.filter(c => !c.groupId || !groups.find(g => g.id === c.groupId));
  const isDraggingColor = draggingType === 'color';

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Stack gap="xs" p="xs">
        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text fw={600} size="sm">Palette</Text>
          <Tooltip label="Add group">
            <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => handleAddGroup(crypto.randomUUID(), `Group ${groups.length + 1}`)}>
              <FolderPlus size={14} />
            </ActionIcon>
          </Tooltip>
        </Box>

        <AddItemButton label="Add Color" hint="C" onClick={onAddColor} />

        <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
          <Stack gap={6}>
            {groups.map(group => {
              const groupColors = palette.filter(c => c.groupId === group.id);
              return (
                <SortableGroup key={group.id} group={group} collapsed={collapsedGroups.has(group.id)}
                  isDraggingColor={isDraggingColor} autoEdit={group.id === newGroupId}
                  showDragHandle={groups.length > 1} colorCount={groupColors.length}
                  onToggleCollapse={() => toggleCollapse(group.id)}
                  onRename={(name) => onRenameGroup(group.id, name)}
                  onDelete={() => onRemoveGroup(group.id)}>
                  <SortableContext items={groupColors.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <Stack gap={4}>
                      {groupColors.map(color => <SortableColorItem key={color.id} color={color} />)}
                    </Stack>
                  </SortableContext>
                </SortableGroup>
              );
            })}
          </Stack>
        </SortableContext>

        {ungroupedColors.length > 0 && (
          <>
            {groups.length > 0 && <Text size="xs" c="dimmed" fw={500} style={{ marginTop: 4 }}>Ungrouped</Text>}
            <SortableContext items={ungroupedColors.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <Stack gap={4}>
                {ungroupedColors.map(color => <SortableColorItem key={color.id} color={color} />)}
              </Stack>
            </SortableContext>
            <GroupDropZone groupId={undefined} isDraggingColor={isDraggingColor} />
          </>
        )}

      </Stack>
    </DndContext>
  );
}

