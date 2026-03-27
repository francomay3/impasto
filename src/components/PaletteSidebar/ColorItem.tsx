import { useState, useCallback } from 'react';
import { Stack, Box, Text, Badge, ActionIcon, Tooltip, TextInput, Menu } from '@mantine/core';
import { Crosshair, X, GripVertical, Folder, Plus, Eye, EyeOff } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Color } from '../../types';
import { usePaletteContext } from '../../context/PaletteContext';
import { useEditorContext } from '../../context/EditorContext';
import { useContextTrigger } from '../../hooks/useContextTrigger';
import { useColorContextMenu } from '../../hooks/useColorContextMenu';
import { useSelectionContextMenu } from '../../hooks/useSelectionContextMenu';
import { PinEditPopover } from '../PinEditPopover';

interface ColorItemProps {
  color: Color;
  dragHandleRef?: (el: HTMLElement | null) => void;
  dragListeners?: Record<string, (...args: unknown[]) => void>;
}

function ColorItem({ color, dragHandleRef, dragListeners }: ColorItemProps) {
  const { groups, samplingColorId, onStartSampling, onRenameColor, onDeleteColor, onSetColorGroup, onAddGroup } = usePaletteContext();
  const { selectedColorIds, onSelectColor, onToggleColorSelection, hoveredColorId, onHoverColor, hiddenPinIds, onTogglePinVisibility } = useEditorContext();
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [editPopoverPos, setEditPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const openColorMenu = useColorContextMenu();
  const openSelectionMenu = useSelectionContextMenu();

  const handleNameEditStart = useCallback(() => {
    setEditNameValue(color.name || color.hex.toLowerCase());
    setEditingName(true);
  }, [color.name, color.hex]);

  const handleNameSubmit = () => {
    const trimmed = editNameValue.trim();
    const newName = trimmed === color.hex.toLowerCase() ? '' : trimmed;
    if (newName !== (color.name ?? '')) onRenameColor(color.id, newName);
    setEditingName(false);
  };

  const handleAuxClick = (e: React.MouseEvent) => {
    if (e.button === 1) { e.preventDefault(); onDeleteColor(color.id); }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.metaKey || e.shiftKey) onToggleColorSelection(color.id);
    else onSelectColor(color.id);
  };

  const openContextMenu = useCallback(({ x, y }: { x: number; y: number }) => {
    if (selectedColorIds.size > 1 && selectedColorIds.has(color.id)) {
      openSelectionMenu({ x, y });
    } else {
      openColorMenu(color.id, { x, y }, { onEditStart: () => setEditPopoverPos({ x, y }) });
    }
  }, [color.id, selectedColorIds, openColorMenu, openSelectionMenu]);

  const contextTrigger = useContextTrigger(openContextMenu);

  const isSelected = selectedColorIds.has(color.id);
  const outline = samplingColorId === color.id
    ? '2px solid var(--mantine-color-blue-4)'
    : isSelected
      ? '2px solid var(--mantine-color-primary-4)'
      : hoveredColorId === color.id
        ? '2px solid var(--mantine-color-secondary-4)'
        : undefined;

  return (
    <>
    <Box
      onMouseDown={handleAuxClick}
      onClick={handleClick}
      onMouseEnter={() => onHoverColor(color.id)}
      onMouseLeave={() => onHoverColor(null)}
      {...contextTrigger}
      style={{ border: '1px solid var(--mantine-color-dark-4)', outline, outlineOffset: -2, borderRadius: 6, padding: 8, background: 'var(--mantine-color-dark-7)', cursor: 'pointer', userSelect: 'none' }}
    >
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
            <Text size="xs" ff={color.name ? undefined : 'monospace'} onClick={handleNameEditStart} data-testid="color-name"
              style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'text' }}>
              {color.name || color.hex.toLowerCase()}
            </Text>
          )}
        </Box>

        <Box style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 46 }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
            {color.name && <Text ff="monospace" c="dimmed" style={{ fontSize: 10, userSelect: 'text' }}>{color.hex.toLowerCase()}</Text>}
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
            {color.sample && (
              <Tooltip label={hiddenPinIds.has(color.id) ? 'Show pin' : 'Hide pin'}>
                <ActionIcon size="sm" variant="subtle" color="gray"
                  onClick={(e) => { e.stopPropagation(); onTogglePinVisibility(color.id); }}>
                  {hiddenPinIds.has(color.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label="Sample from image">
              <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => onStartSampling(color.id)}><Crosshair size={13} /></ActionIcon>
            </Tooltip>
            <Tooltip label="Delete color">
              <ActionIcon size="sm" variant="subtle" color="red" data-testid="color-delete" onClick={() => onDeleteColor(color.id)}><X size={13} /></ActionIcon>
            </Tooltip>
          </Box>
        </Box>

        {color.mixRecipe && <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>{color.mixRecipe}</Text>}
      </Stack>
    </Box>
    {editPopoverPos && <PinEditPopover colorId={color.id} position={editPopoverPos} onClose={() => setEditPopoverPos(null)} />}
    </>
  );
}

export function SortableColorItem({ color, index }: { color: Color; index: number }) {
  const { selectedColorIds } = useEditorContext();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: color.id, data: { type: 'color' } });
  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      data-testid={`color-item-${index}`}
      data-selected={selectedColorIds.has(color.id) ? 'true' : undefined}
    >
      <ColorItem color={color} dragHandleRef={setActivatorNodeRef} dragListeners={listeners as Record<string, (...args: unknown[]) => void>} />
    </Box>
  );
}
