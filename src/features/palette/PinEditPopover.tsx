import { useState, useEffect, useRef } from 'react';
import { Portal, Paper, TextInput, Button, Group, Stack, Text } from '@mantine/core';
import { usePaletteContext } from './PaletteContext';
import { PinEditGroupSection } from './PinEditGroupSection';
import { clampToViewport } from '../../utils/geometry';
import { resolveGroupOnSave } from '../../utils/groupFormLogic';

const POPOVER_W = 220;
const POPOVER_H_EST = 210;

interface Props {
  colorId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function PinEditPopover({ colorId, position, onClose }: Props) {
  const { palette, groups, onRenameColor, onSetColorGroup, onAddGroup } = usePaletteContext();
  const color = palette.find((c) => c.id === colorId);

  const [name, setName] = useState(color?.name ?? '');
  const [groupId, setGroupId] = useState<string | null>(color?.groupId ?? null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const selectOpenRef = useRef(false);
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (selectOpenRef.current) return;
      if (paperRef.current && !paperRef.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [onClose]);

  if (!color) return null;

  const { left, top } = clampToViewport(position.x + 4, position.y + 4, POPOVER_W, POPOVER_H_EST);

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed !== (color.name ?? '')) onRenameColor(colorId, trimmed);

    const { finalGroupId, newGroup } = resolveGroupOnSave(creatingGroup, groupId, newGroupName);
    if (newGroup) onAddGroup(newGroup.id, newGroup.name);
    if (finalGroupId !== (color.groupId ?? null)) onSetColorGroup(colorId, finalGroupId ?? undefined);
    onClose();
  };

  const handleGroupChange = (val: string | null) => {
    if (val === '__new__') { setCreatingGroup(true); setGroupId(null); return; }
    setCreatingGroup(false);
    setGroupId(val);
  };

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
            onChange={(e) => setName(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
            autoFocus
          />
          <PinEditGroupSection
            groups={groups}
            groupId={groupId}
            creatingGroup={creatingGroup}
            newGroupName={newGroupName}
            selectOpenRef={selectOpenRef}
            onGroupChange={handleGroupChange}
            onNewGroupNameChange={setNewGroupName}
            onBack={() => { setCreatingGroup(false); setGroupId(color.groupId ?? null); }}
            onSave={handleSave}
          />
          <Group gap="xs" justify="flex-end" mt={2}>
            <Button size="xs" variant="subtle" color="gray" onClick={onClose}>Cancel</Button>
            <Button size="xs" onClick={handleSave}>Save</Button>
          </Group>
        </Stack>
      </Paper>
    </Portal>
  );
}
