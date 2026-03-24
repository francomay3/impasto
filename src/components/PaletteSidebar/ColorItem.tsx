import { useState } from 'react';
import { Stack, Box, Text, Badge, ActionIcon, Tooltip, TextInput, Menu } from '@mantine/core';
import { Crosshair, X, GripVertical, Folder, Plus } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Color } from '../../types';
import { usePaletteContext } from '../../context/PaletteContext';

interface ColorItemProps {
  color: Color;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  showDragHandle?: boolean;
  colorInputRef: (el: HTMLInputElement | null) => void;
}

export function ColorItem({ color, dragHandleProps, showDragHandle, colorInputRef }: ColorItemProps) {
  const { groups, samplingColorId, onStartSampling, onColorChange, onRenameColor, onDeleteColor, onSetColorGroup, onAddGroup, onToggleHighlight } = usePaletteContext();
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const handleNameEditStart = () => {
    setEditNameValue(color.name || color.hex.toUpperCase());
    setEditingName(true);
  };

  const handleNameSubmit = () => {
    const trimmed = editNameValue.trim();
    onRenameColor(color.id, trimmed === color.hex.toUpperCase() ? '' : trimmed);
    setEditingName(false);
  };

  const handleAuxClick = (e: React.MouseEvent) => {
    if (e.button === 1) { e.preventDefault(); onDeleteColor(color.id); }
  };

  return (
    <Box onMouseDown={handleAuxClick} style={{ border: samplingColorId === color.id ? '2px solid var(--mantine-color-blue-4)' : '1px solid var(--mantine-color-dark-4)', borderRadius: 6, padding: 8, background: 'var(--mantine-color-dark-7)' }}>
      <Stack gap={4}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {showDragHandle && (
            <Box {...dragHandleProps} style={{ cursor: 'grab', color: 'var(--mantine-color-dark-2)', display: 'flex', alignItems: 'center', flexShrink: 0, touchAction: 'none' }}>
              <GripVertical size={14} />
            </Box>
          )}
          <Box style={{ position: 'relative', width: 26, height: 26, flexShrink: 0 }}>
            <Box style={{ width: 26, height: 26, borderRadius: 4, background: color.hex, border: '1px solid var(--mantine-color-dark-3)', cursor: 'pointer' }} />
            <input type="color" value={color.hex} onChange={(e) => onColorChange(color.id, e.target.value)} ref={colorInputRef}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
          </Box>
          {editingName ? (
            <TextInput value={editNameValue} onChange={(e) => setEditNameValue(e.currentTarget.value)}
              onBlur={handleNameSubmit} onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); if (e.key === 'Escape') setEditingName(false); }}
              size="xs" autoFocus style={{ flex: 1 }} />
          ) : (
            <Text size="xs" ff={color.name ? undefined : 'monospace'} onClick={handleNameEditStart}
              style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'text' }}>
              {color.name || color.hex.toUpperCase()}
            </Text>
          )}
        </Box>

        <Box style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 46 }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
            {color.name && <Text ff="monospace" c="dimmed" style={{ fontSize: 10 }}>{color.hex.toUpperCase()}</Text>}
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

interface SortableColorItemProps {
  color: Color;
  showDragHandle?: boolean;
  colorInputRef: (el: HTMLInputElement | null) => void;
}

export function SortableColorItem({ color, showDragHandle, colorInputRef }: SortableColorItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: color.id, data: { type: 'color' } });
  return (
    <Box ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      <ColorItem color={color} dragHandleProps={{ ...attributes, ...listeners }} showDragHandle={showDragHandle} colorInputRef={colorInputRef} />
    </Box>
  );
}
