import { useState, useCallback } from 'react';
import { Stack, Box, Text, Badge, ActionIcon, Tooltip, TextInput, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Crosshair, X, GripVertical, Folder, Plus, Copy } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Color } from '../../types';
import { usePaletteContext } from '../../context/PaletteContext';
import { useContextMenu } from '../../context/ContextMenuContext';
import { useContextTrigger } from '../../hooks/useContextTrigger';

interface ColorItemProps {
  color: Color;
  dragHandleRef?: (el: HTMLElement | null) => void;
  dragListeners?: Record<string, (...args: unknown[]) => void>;
}

export function ColorItem({ color, dragHandleRef, dragListeners }: ColorItemProps) {
  const { groups, samplingColorId, onStartSampling, onRenameColor, onDeleteColor, onSetColorGroup, onAddGroup, onToggleHighlight } = usePaletteContext();
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const { open: openMenu } = useContextMenu();

  const handleNameEditStart = () => {
    setEditNameValue(color.name || color.hex.toLowerCase());
    setEditingName(true);
  };

  const handleNameSubmit = () => {
    const trimmed = editNameValue.trim();
    const newName = trimmed === color.hex.toLowerCase() ? '' : trimmed;
    if (newName !== (color.name ?? '')) onRenameColor(color.id, newName);
    setEditingName(false);
  };

  const handleAuxClick = (e: React.MouseEvent) => {
    if (e.button === 1) { e.preventDefault(); onDeleteColor(color.id); }
  };

  const openContextMenu = useCallback(({ x, y }: { x: number; y: number }) => {
    openMenu({ x, y, items: [
      { label: 'Sample from image', icon: <Crosshair size={14} />, onClick: () => onStartSampling(color.id) },
      { label: 'Rename',            icon: <Folder size={14} />,    onClick: handleNameEditStart },
      { label: 'Copy hex',          icon: <Copy size={14} />,      onClick: () => { navigator.clipboard.writeText(color.hex.toLowerCase()); notifications.show({ message: `Copied ${color.hex.toLowerCase()}`, color: 'green', autoClose: 1500 }); } },
      { type: 'divider' },
      { label: 'Delete', icon: <X size={14} />, onClick: () => onDeleteColor(color.id), color: 'red' },
    ]});
  }, [color, openMenu, onStartSampling, onDeleteColor]); // eslint-disable-line react-hooks/exhaustive-deps

  const contextTrigger = useContextTrigger(openContextMenu);

  return (
    <Box onMouseDown={handleAuxClick} {...contextTrigger} style={{ border: samplingColorId === color.id ? '2px solid var(--mantine-color-blue-4)' : '1px solid var(--mantine-color-dark-4)', borderRadius: 6, padding: 8, background: 'var(--mantine-color-dark-7)' }}>
      <Stack gap={4}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Box ref={dragHandleRef} {...dragListeners} style={{ color: 'var(--mantine-color-dark-3)', display: 'flex', alignItems: 'center', flexShrink: 0, cursor: 'grab', touchAction: 'none' }}>
            <GripVertical size={14} />
          </Box>
          <Box style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 4, background: color.hex, border: '1px solid var(--mantine-color-dark-3)' }} />
          {editingName ? (
            <TextInput value={editNameValue} onChange={(e) => setEditNameValue(e.currentTarget.value)}
              onBlur={handleNameSubmit} onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); if (e.key === 'Escape') setEditingName(false); }}
              size="xs" autoFocus style={{ flex: 1 }} />
          ) : (
            <Text size="xs" ff={color.name ? undefined : 'monospace'} onClick={handleNameEditStart}
              style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'text' }}>
              {color.name || color.hex.toLowerCase()}
            </Text>
          )}
        </Box>

        <Box style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 46 }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
            {color.name && <Text ff="monospace" c="dimmed" style={{ fontSize: 10 }}>{color.hex.toLowerCase()}</Text>}
            {color.ratio > 0 && <Badge size="xs" variant="outline" color="gray">{color.ratio}%</Badge>}
          </Box>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <Menu shadow="md" width={160} position="bottom-end">
              <Menu.Target>
                <Tooltip label="Move to group">
                  <ActionIcon size="sm" variant="subtle" color={color.groupId ? 'blue' : 'gray'}><Folder size={13} /></ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Assign group</Menu.Label>
                <Menu.Item leftSection={<X size={12} />} onClick={() => onSetColorGroup(color.id, undefined)} style={{ fontWeight: !color.groupId ? 600 : 400 }}>No group</Menu.Item>
                {groups.map(g => (
                  <Menu.Item key={g.id} leftSection={<Folder size={12} />} onClick={() => onSetColorGroup(color.id, g.id)} style={{ fontWeight: color.groupId === g.id ? 600 : 400 }}>{g.name}</Menu.Item>
                ))}
                <Menu.Divider />
                <Menu.Item leftSection={<Plus size={12} />} onClick={() => { const id = crypto.randomUUID(); onAddGroup(id, `Group ${groups.length + 1}`); onSetColorGroup(color.id, id); }}>New group</Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Tooltip label={color.highlighted ? 'Remove highlight' : 'Highlight in indexed view'}>
              <ActionIcon size="sm" variant={color.highlighted ? 'filled' : 'subtle'} color={color.highlighted ? 'green' : 'gray'} onClick={() => onToggleHighlight(color.id)}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color.highlighted ? '#fff' : 'currentColor' }} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Sample from image">
              <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => onStartSampling(color.id)}><Crosshair size={13} /></ActionIcon>
            </Tooltip>
            <Tooltip label="Delete color">
              <ActionIcon size="sm" variant="subtle" color="red" onClick={() => onDeleteColor(color.id)}><X size={13} /></ActionIcon>
            </Tooltip>
          </Box>
        </Box>

        {color.mixRecipe && <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>{color.mixRecipe}</Text>}
      </Stack>
    </Box>
  );
}

export function SortableColorItem({ color }: { color: Color }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: color.id, data: { type: 'color' } });
  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      <ColorItem color={color} dragHandleRef={setActivatorNodeRef} dragListeners={listeners as Record<string, (...args: unknown[]) => void>} />
    </Box>
  );
}
