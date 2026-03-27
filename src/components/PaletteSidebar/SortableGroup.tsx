import { useState, useCallback } from 'react';
import { Box, Text, ActionIcon, Tooltip, TextInput } from '@mantine/core';
import { X, GripVertical, ChevronDown, ChevronRight, Pencil, Eye, EyeOff } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useConfirmDialog from '../useConfirmDialog';
import type { ColorGroup } from '../../types';
import { GroupDropZone } from './GroupDropZone';
import { useContextMenu } from '../../context/ContextMenuContext';
import { useContextTrigger } from '../../hooks/useContextTrigger';
import { useEditorContext } from '../../context/EditorContext';

interface Props {
  group: ColorGroup;
  children: React.ReactNode;
  collapsed: boolean;
  isDraggingColor: boolean;
  autoEdit?: boolean;
  showDragHandle?: boolean;
  colorCount: number;
  sampleColorIds: string[];
  onToggleCollapse: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function SortableGroup({ group, children, collapsed, isDraggingColor, autoEdit, showDragHandle, colorCount, sampleColorIds, onToggleCollapse, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(() => autoEdit ?? false);
  const [editName, setEditName] = useState(group.name);
  const { hiddenPinIds, onSetGroupPinsVisible } = useEditorContext();
  const allPinsHidden = sampleColorIds.length > 0 && sampleColorIds.every(id => hiddenPinIds.has(id));
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: group.id, data: { type: 'group' } });
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
    <Box ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }} data-testid="group-item" {...contextTrigger}>
      {confirmDialog}
      <Box style={{ border: '1px solid var(--mantine-color-dark-5)', borderRadius: 6, overflow: 'hidden' }}>
        <Box
          {...(showDragHandle ? attributes : {})}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'var(--mantine-color-dark-6)' }}
        >
          {showDragHandle && (
            <Box ref={setActivatorNodeRef} {...listeners} style={{ color: 'var(--mantine-color-dark-2)', display: 'flex', flexShrink: 0, cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}>
              <GripVertical size={13} />
            </Box>
          )}
          <Box style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 4 }}>
            {colorCount > 0 && (
              <Box
                onClick={onToggleCollapse}
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--mantine-color-dark-1)', flexShrink: 0 }}
              >
                {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </Box>
            )}
            {editing ? (
              <TextInput value={editName} onChange={(e) => setEditName(e.currentTarget.value)}
                onBlur={handleRenameSubmit} onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setEditing(false); }}
                onFocus={(e) => e.currentTarget.select()} size="xs" autoFocus style={{ flex: 1 }} onClick={(e) => e.stopPropagation()} />
            ) : (
              <Box style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <Text size="xs" fw={600} c="dimmed" data-testid="group-name" style={{ userSelect: 'none' }}>{group.name}</Text>
                {colorCount === 0 && <Text size="xs" c="dimmed" style={{ fontStyle: 'italic', opacity: 0.5 }}>empty</Text>}
              </Box>
            )}
          </Box>
          {!editing && sampleColorIds.length > 0 && (
            <Tooltip label={allPinsHidden ? 'Show group pins' : 'Hide group pins'}>
              <ActionIcon size="xs" variant="subtle" color="gray"
                onClick={(e) => { e.stopPropagation(); onSetGroupPinsVisible(sampleColorIds, allPinsHidden); }}>
                {allPinsHidden ? <EyeOff size={11} /> : <Eye size={11} />}
              </ActionIcon>
            </Tooltip>
          )}
          {!editing && (
            <Tooltip label="Delete group">
              <ActionIcon size="xs" variant="subtle" color="red" data-testid="group-delete" onClick={(e) => { e.stopPropagation(); void (colorCount > 0 ? confirmDelete() : onDelete()); }}>
                <X size={11} />
              </ActionIcon>
            </Tooltip>
          )}
        </Box>
        {colorCount === 0 && (
          <Box px={6} pb={6}><GroupDropZone groupId={group.id} isDraggingColor={isDraggingColor} /></Box>
        )}
        {colorCount > 0 && !collapsed && (
          <Box p={6}>
            {children}
          </Box>
        )}
      </Box>
    </Box>
  );
}
