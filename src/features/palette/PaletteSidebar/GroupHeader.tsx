import { useState, useCallback } from 'react';
import { Box, ActionIcon, Tooltip } from '@mantine/core';
import { X, GripVertical, ChevronDown, ChevronRight, Pencil, Eye, EyeOff } from 'lucide-react';
import useConfirmDialog from '../../../shared/useConfirmDialog';
import type { ColorGroup } from '../../../types';
import { useContextMenuStore } from '../../../shared/contextMenuStore';
import { useContextTrigger } from '../../../hooks/useContextTrigger';
import { useEditorStore } from '../../editor/editorStore';
import { GroupNameEditor } from './GroupNameEditor';
import { areAllPinsHidden } from '../../../utils/groupHeaderLogic';

interface Props {
  group: ColorGroup;
  collapsed: boolean;
  colorCount: number;
  sampleColorIds: string[];
  showDragHandle: boolean;
  isDragging: boolean;
  autoEdit?: boolean;
  dragHandleRef: (el: HTMLElement | null) => void;
  dragHandleListeners: Record<string, unknown> | undefined;
  dragContainerAttributes: Record<string, unknown>;
  onToggleCollapse: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function GroupHeader({
  group, collapsed, colorCount, sampleColorIds, showDragHandle, isDragging, autoEdit,
  dragHandleRef, dragHandleListeners, dragContainerAttributes,
  onToggleCollapse, onRename, onDelete,
}: Props) {
  const [editing, setEditing] = useState(() => autoEdit ?? false);
  const [editName, setEditName] = useState(group.name);
  const hiddenPinIds = useEditorStore(s => s.hiddenPinIds);
  const setGroupPinsVisible = useEditorStore(s => s.setGroupPinsVisible);
  const openMenu = useContextMenuStore(s => s.open);

  const allPinsHidden = areAllPinsHidden(sampleColorIds, hiddenPinIds);

  const { confirm: confirmDelete, confirmDialog } = useConfirmDialog({
    title: 'Delete group',
    description: `Delete "${group.name}"? Colors in this group will become ungrouped.`,
    onConfirm: onDelete,
  });

  const handleRenameSubmit = () => {
    if (editName.trim()) onRename(editName.trim());
    setEditing(false);
  };

  const openContextMenu = useCallback(
    ({ x, y }: { x: number; y: number }) => {
      openMenu({
        x, y,
        items: [
          {
            label: 'Rename',
            icon: <Pencil size={14} />,
            onClick: () => { setEditing(true); setEditName(group.name); },
          },
          ...(colorCount > 0 ? [{
            label: collapsed ? 'Expand' : 'Collapse',
            icon: collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />,
            onClick: onToggleCollapse,
          }] : []),
          { type: 'divider' as const },
          {
            label: 'Delete group',
            icon: <X size={14} />,
            onClick: () => (colorCount > 0 ? confirmDelete() : onDelete()),
            color: 'red',
          },
        ],
      });
    },
    [group.name, collapsed, colorCount, openMenu, onToggleCollapse, confirmDelete, onDelete]
  );

  const contextTrigger = useContextTrigger(openContextMenu);

  return (
    <Box
      {...(showDragHandle ? dragContainerAttributes : {})}
      data-testid="group-header"
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'var(--mantine-color-dark-6)' }}
      {...contextTrigger}
    >
      {confirmDialog}
      {showDragHandle && (
        <Box
          ref={dragHandleRef}
          {...dragHandleListeners}
          style={{ color: 'var(--mantine-color-dark-2)', display: 'flex', flexShrink: 0, cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        >
          <GripVertical size={13} />
        </Box>
      )}
      <Box style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 4 }}>
        {colorCount > 0 && (
          <Box onClick={onToggleCollapse} data-testid="group-toggle"
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--mantine-color-dark-1)', flexShrink: 0 }}>
            {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </Box>
        )}
        <GroupNameEditor
          editing={editing}
          editName={editName}
          groupName={group.name}
          colorCount={colorCount}
          onChange={setEditName}
          onSubmit={handleRenameSubmit}
          onCancel={() => setEditing(false)}
        />
      </Box>
      {!editing && sampleColorIds.length > 0 && (
        <Tooltip label={allPinsHidden ? 'Show group pins' : 'Hide group pins'}>
          <ActionIcon size="xs" variant="subtle" color="gray" data-testid="group-pin-visibility-toggle"
            data-hidden={allPinsHidden ? 'true' : undefined}
            onClick={(e) => { e.stopPropagation(); setGroupPinsVisible(sampleColorIds, allPinsHidden); }}>
            {allPinsHidden ? <EyeOff size={11} /> : <Eye size={11} />}
          </ActionIcon>
        </Tooltip>
      )}
      {!editing && (
        <Tooltip label="Delete group">
          <ActionIcon size="xs" variant="subtle" color="red" data-testid="group-delete"
            onClick={(e) => { e.stopPropagation(); void (colorCount > 0 ? confirmDelete() : onDelete()); }}>
            <X size={11} />
          </ActionIcon>
        </Tooltip>
      )}
    </Box>
  );
}
