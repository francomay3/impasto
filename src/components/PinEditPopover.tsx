import { useState, useEffect, useRef, useCallback } from 'react';
import { Portal, Paper, TextInput, Select, Button, Group, Stack, Text } from '@mantine/core';
import type { ComboboxItem } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { usePaletteContext } from '../context/PaletteContext';

const NEW_GROUP = '__new__';
const POPOVER_W = 220;
const POPOVER_H_EST = 210;

interface Props {
  colorId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function PinEditPopover({ colorId, position, onClose }: Props) {
  const { palette, groups, onRenameColor, onSetColorGroup, onAddGroup } = usePaletteContext();
  const color = palette.find(c => c.id === colorId);

  const [name, setName] = useState(color?.name ?? '');
  const [groupId, setGroupId] = useState<string | null>(color?.groupId ?? null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const selectOpenRef = useRef(false);
  const paperRef = useRef<HTMLDivElement>(null);

  const handleDropdownOpen = useCallback(() => { selectOpenRef.current = true; }, []);
  const handleDropdownClose = useCallback(() => { selectOpenRef.current = false; }, []);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (selectOpenRef.current) return;
      if (paperRef.current && !paperRef.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [onClose]);

  if (!color) return null;

  const left = Math.min(position.x + 4, window.innerWidth - POPOVER_W - 8);
  const top = Math.min(position.y + 4, window.innerHeight - POPOVER_H_EST - 8);

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed !== (color.name ?? '')) onRenameColor(colorId, trimmed);

    let finalGroupId = groupId;
    if (creatingGroup) {
      const groupName = newGroupName.trim();
      if (groupName) {
        const id = crypto.randomUUID();
        onAddGroup(id, groupName);
        finalGroupId = id;
      } else {
        finalGroupId = null;
      }
    }
    if (finalGroupId !== (color.groupId ?? null)) onSetColorGroup(colorId, finalGroupId ?? undefined);
    onClose();
  };

  const selectData: ComboboxItem[] = [
    ...groups.map(g => ({ value: g.id, label: g.name })),
    { value: NEW_GROUP, label: '+ New group' },
  ];

  const handleGroupChange = (val: string | null) => {
    if (val === NEW_GROUP) { setCreatingGroup(true); setGroupId(null); return; }
    setCreatingGroup(false);
    setGroupId(val);
  };

  const handleBackToSelect = () => { setCreatingGroup(false); setGroupId(color.groupId ?? null); };

  return (
    <Portal>
      <Paper
        ref={paperRef}
        shadow="md"
        p="sm"
        withBorder
        data-no-pan
        data-testid="pin-edit-popover"
        style={{ position: 'fixed', left, top, zIndex: 400, width: POPOVER_W }}
      >
        <Stack gap="xs">
          <Text size="xs" fw={600} c="dimmed">Edit color</Text>
          <TextInput
            label="Name"
            size="xs"
            placeholder={color.hex.toLowerCase()}
            value={name}
            onChange={e => setName(e.currentTarget.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
            autoFocus
          />
          {!creatingGroup ? (
            <Select
              label="Group"
              size="xs"
              data={selectData}
              value={groupId}
              onChange={handleGroupChange}
              clearable
              placeholder="No group"
              comboboxProps={{ withinPortal: true, zIndex: 401 }}
              onDropdownOpen={handleDropdownOpen}
              onDropdownClose={handleDropdownClose}
            />
          ) : (
            <TextInput
              label="New group name"
              size="xs"
              placeholder="Group name"
              value={newGroupName}
              onChange={e => setNewGroupName(e.currentTarget.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              leftSection={<ArrowLeft size={12} data-testid="new-group-back" style={{ cursor: 'pointer' }} onClick={handleBackToSelect} />}
              autoFocus
            />
          )}
          <Group gap="xs" justify="flex-end" mt={2}>
            <Button size="xs" variant="subtle" color="gray" onClick={onClose}>Cancel</Button>
            <Button size="xs" onClick={handleSave}>Save</Button>
          </Group>
        </Stack>
      </Paper>
    </Portal>
  );
}
