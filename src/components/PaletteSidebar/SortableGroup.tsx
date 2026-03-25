import { useState, useCallback } from 'react';
import { Box, Text, ActionIcon, Tooltip, TextInput } from '@mantine/core';
import { X, GripVertical, ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useConfirmDialog from '../useConfirmDialog';
import type { ColorGroup } from '../../types';
import { GroupDropZone } from './GroupDropZone';
import { useContextMenu } from '../../context/ContextMenuContext';
import { useContextTrigger } from '../../hooks/useContextTrigger';

interface Props {
  group: ColorGroup;
  children: React.ReactNode;
  collapsed: boolean;
  isDraggingColor: boolean;
  autoEdit?: boolean;
  showDragHandle?: boolean;
  colorCount: number;
  onToggleCollapse: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function SortableGroup({ group, children, collapsed, isDraggingColor, autoEdit, showDragHandle, colorCount, onToggleCollapse, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(() => autoEdit ?? false);
  const [editName, setEditName] = useState(group.name);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id, data: { type: 'group' } });
  const { open: openMenu } = useContextMenu();

  const { confirm: confirmDelete, confirmDialog } = useConfirmDialog({
    title: 'Delete group',
    description: `Delete "${group.name}"? Colors in this group will become ungrouped.`,
    onConfirm: onDelete,
  });

  const handleRenameSubmit = () => {
    if (editName.trim()) onRename(editName.trim());
    setEditing(false);
  };

  const openContextMenu = useCallback(({ x, y }: { x: number; y: number }) => {
    openMenu({ x, y, items: [
      { label: 'Rename', icon: <Pencil size={14} />, onClick: () => { setEditing(true); setEditName(group.name); } },
      ...(colorCount > 0 ? [{ label: collapsed ? 'Expand' : 'Collapse', icon: collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />, onClick: onToggleCollapse }] : []),
      { type: 'divider' as const },
      { label: 'Delete group', icon: <X size={14} />, onClick: () => (colorCount > 0 ? confirmDelete() : onDelete()), color: 'red' },
    ]});
  }, [group.name, collapsed, colorCount, openMenu, onToggleCollapse, confirmDelete, onDelete]);

  const contextTrigger = useContextTrigger(openContextMenu);

  return (
    <Box ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }} {...contextTrigger}>
      {confirmDialog}
      <Box style={{ border: '1px solid var(--mantine-color-dark-5)', borderRadius: 6, overflow: 'hidden' }}>
        <Box
          {...(showDragHandle ? { ...attributes, ...listeners } : {})}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'var(--mantine-color-dark-6)', ...(showDragHandle ? { cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' } : {}) }}
        >
          {showDragHandle && (
            <Box style={{ color: 'var(--mantine-color-dark-2)', display: 'flex', flexShrink: 0 }}>
              <GripVertical size={13} />
            </Box>
          )}
          <Box onClick={colorCount > 0 ? onToggleCollapse : undefined} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 4, cursor: colorCount > 0 ? 'pointer' : 'default' }}>
            {colorCount > 0 && (collapsed ? <ChevronRight size={13} color="var(--mantine-color-dark-1)" /> : <ChevronDown size={13} color="var(--mantine-color-dark-1)" />)}
            {editing ? (
              <TextInput value={editName} onChange={(e) => setEditName(e.currentTarget.value)}
                onBlur={handleRenameSubmit} onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setEditing(false); }}
                onFocus={(e) => e.currentTarget.select()} size="xs" autoFocus style={{ flex: 1 }} onClick={(e) => e.stopPropagation()} />
            ) : (
              <Box style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <Text size="xs" fw={600} c="dimmed" onClick={(e) => { e.stopPropagation(); setEditing(true); setEditName(group.name); }} style={{ cursor: 'text' }}>{group.name}</Text>
                {colorCount === 0 && <Text size="xs" c="dimmed" style={{ fontStyle: 'italic', opacity: 0.5 }}>empty</Text>}
              </Box>
            )}
          </Box>
          {!editing && (
            <Tooltip label="Delete group">
              <ActionIcon size="xs" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); void (colorCount > 0 ? confirmDelete() : onDelete()); }}>
                <X size={11} />
              </ActionIcon>
            </Tooltip>
          )}
        </Box>
        {(colorCount === 0 || collapsed) && isDraggingColor && (
          <Box px={6} pb={6}><GroupDropZone groupId={group.id} isDraggingColor={isDraggingColor} /></Box>
        )}
        {colorCount > 0 && !collapsed && (
          <Box p={6}>
            {children}
            <GroupDropZone groupId={group.id} isDraggingColor={isDraggingColor} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
