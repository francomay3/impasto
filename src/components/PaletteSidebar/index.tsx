import { useRef, useState, useCallback } from 'react';
import { Stack, Box, Text, ActionIcon, Tooltip, NumberInput, Divider } from '@mantine/core';
import { FolderPlus } from 'lucide-react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AddItemButton } from '../AddItemButton';
import type { Color, ColorGroup } from '../../types';
import { ColorItem, SortableColorItem, type ColorItemSharedProps } from './ColorItem';
import { GroupDropZone } from './GroupDropZone';
import { SortableGroup } from './SortableGroup';
import { usePaletteDnd } from './usePaletteDnd';

interface Props {
  palette: Color[];
  groups: ColorGroup[];
  blur: number;
  samplingColorId: string | null;
  onBlurChange: (v: number) => void;
  onStartSampling: (id: string) => void;
  onColorChange: (id: string, hex: string) => void;
  onRenameColor: (id: string, name: string) => void;
  onAddColor: () => void;
  onDeleteColor: (id: string) => void;
  onToggleHighlight: (id: string) => void;
  onAddGroup: (id: string, name: string) => void;
  onRemoveGroup: (id: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onSetColorGroup: (colorId: string, groupId: string | undefined) => void;
  onReorderPalette: (palette: Color[]) => void;
  onReorderGroups: (groups: ColorGroup[]) => void;
}

export function PaletteSidebar({
  palette, groups, blur, samplingColorId,
  onBlurChange, onStartSampling, onColorChange, onRenameColor, onAddColor, onDeleteColor,
  onToggleHighlight, onAddGroup, onRemoveGroup, onRenameGroup, onSetColorGroup, onReorderPalette, onReorderGroups,
}: Props) {
  const colorInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [newGroupId, setNewGroupId] = useState<string | null>(null);

  const handleAddGroup = useCallback((id: string, name: string) => {
    onAddGroup(id, name);
    setNewGroupId(id);
  }, [onAddGroup]);

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

  const colorRef = (id: string) => (el: HTMLInputElement | null) => {
    if (el) colorInputRefs.current.set(id, el);
    else colorInputRefs.current.delete(id);
  };

  const ungroupedColors = palette.filter(c => !c.groupId || !groups.find(g => g.id === c.groupId));
  const isDraggingColor = draggingType === 'color';

  const colorProps = (color: Color): ColorItemSharedProps => ({
    groups, samplingColorId, onStartSampling, onColorChange, onRenameColor, onDeleteColor,
    onSetGroup: onSetColorGroup, onAddGroup: handleAddGroup, onToggleHighlight, colorInputRef: colorRef(color.id),
  });

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Stack gap="xs" p="md">
        <Text fw={600} size="sm">Pre-Indexing</Text>
        <Stack gap={2}>
          <Text size="xs" c="dimmed">Simplification blur</Text>
          <NumberInput value={blur} min={0} max={50} suffix="px" onChange={(v) => onBlurChange(Number(v))} size="xs" />
        </Stack>
        <Divider />

        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text fw={600} size="sm">Palette</Text>
          <Tooltip label="Add group">
            <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => handleAddGroup(crypto.randomUUID(), `Group ${groups.length + 1}`)}>
              <FolderPlus size={14} />
            </ActionIcon>
          </Tooltip>
        </Box>

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
                      {groupColors.map(color => <SortableColorItem key={color.id} color={color} showDragHandle {...colorProps(color)} />)}
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
                {ungroupedColors.map(color => <SortableColorItem key={color.id} color={color} showDragHandle {...colorProps(color)} />)}
              </Stack>
            </SortableContext>
            <GroupDropZone groupId={undefined} isDraggingColor={isDraggingColor} />
          </>
        )}

        <AddItemButton label="Add Color" onClick={onAddColor} />
      </Stack>
    </DndContext>
  );
}

// Re-export for any direct imports of sub-components
export { ColorItem };
