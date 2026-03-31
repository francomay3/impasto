import { useState } from 'react';
import {
  Paper,
  Text,
  Select,
  TextInput,
  Button,
  Stack,
  Group,
  ActionIcon,
  Divider,
} from '@mantine/core';
import { Eye, EyeOff, Merge, Trash2, X } from 'lucide-react';
import { useMergePins } from './useMergePins';
import { useEditorStore } from '../editor/editorStore';
import { usePaletteContext } from './PaletteContext';

interface PopoverPos {
  x: number;
  y: number;
}

export function SelectionGroupDialog({ pos, close }: { pos: PopoverPos; close: () => void }) {
  const selectedColorIds = useEditorStore(s => s.selectedColorIds);
  const hiddenPinIds = useEditorStore(s => s.hiddenPinIds);
  const selectColor = useEditorStore(s => s.selectColor);
  const setGroupPinsVisible = useEditorStore(s => s.setGroupPinsVisible);
  const { palette, groups, onDeleteColor, onSetColorGroup, onAddGroup } = usePaletteContext();
  const [newGroupName, setNewGroupName] = useState('');
  const mergePins = useMergePins();

  const ids = [...selectedColorIds];
  const canMerge = ids.length === 2 && ids.every((id) => palette.find((c) => c.id === id)?.sample);
  const allHidden = ids.every((id) => hiddenPinIds.has(id));
  const groupIds = [...new Set(ids.map((id) => palette.find((c) => c.id === id)?.groupId))];
  const currentGroupId = groupIds.length === 1 ? (groupIds[0] ?? '__none__') : null;

  const groupOptions = [
    { value: '__none__', label: 'No group' },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];

  const handleSetGroup = (value: string | null) => {
    const groupId = value === '__none__' ? undefined : (value ?? undefined);
    ids.forEach((colorId) => onSetColorGroup(colorId, groupId));
  };

  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    const groupId = crypto.randomUUID();
    onAddGroup(groupId, name);
    ids.forEach((colorId) => onSetColorGroup(colorId, groupId));
    setNewGroupName('');
    close();
  };

  const handleDelete = () => {
    ids.forEach((colorId) => onDeleteColor(colorId));
    selectColor(null);
    close();
  };

  const DIALOG_W = 220;
  const DIALOG_H_EST = 280;
  const left = Math.min(pos.x, window.innerWidth - DIALOG_W - 8);
  const top = Math.min(pos.y, window.innerHeight - DIALOG_H_EST - 8);

  return (
    <Paper
      p="sm"
      shadow="md"
      data-testid="selection-popover"
      style={{ position: 'fixed', left, top, zIndex: 300, minWidth: 220 }}
      styles={{ root: { background: 'var(--mantine-color-dark-7)', border: '1px solid var(--mantine-color-dark-4)' } }}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text size="xs" fw={500} c="dimmed">{ids.length} colors selected</Text>
          <ActionIcon variant="subtle" size="xs" data-testid="selection-popover-close" onClick={close}>
            <X size={12} />
          </ActionIcon>
        </Group>
        <Divider />
        <Select
          size="xs"
          label="Group"
          placeholder="Mixed"
          data={groupOptions}
          value={currentGroupId}
          onChange={handleSetGroup}
          allowDeselect={false}
        />
        <Group gap="xs" align="flex-end">
          <TextInput
            size="xs"
            label="New group"
            placeholder="Group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
            style={{ flex: 1 }}
          />
          <Button size="xs" variant="light" onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
            Add
          </Button>
        </Group>
        <Divider />
        <Group justify="space-between">
          <Group gap={4}>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => { setGroupPinsVisible(ids, !allHidden); close(); }}
              title={allHidden ? 'Show pins' : 'Hide pins'}
            >
              {allHidden ? <Eye size={14} /> : <EyeOff size={14} />}
            </ActionIcon>
            {canMerge && (
              <ActionIcon
                variant="subtle"
                size="sm"
                data-testid="selection-popover-merge"
                onClick={() => { mergePins(ids[0], ids[1]); selectColor(null); close(); }}
                title="Merge pins — place a new pin at the LAB midpoint color"
              >
                <Merge size={14} />
              </ActionIcon>
            )}
          </Group>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            data-testid="selection-popover-delete"
            onClick={handleDelete}
            title={`Delete ${ids.length} colors`}
          >
            <Trash2 size={14} />
          </ActionIcon>
        </Group>
      </Stack>
    </Paper>
  );
}
