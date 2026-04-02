import { Group, ActionIcon, Tooltip } from '@mantine/core';
import { ArrowUpDown, FolderPlus } from 'lucide-react';
import { AddItemButton } from '../../../shared/AddItemButton';
import { HOTKEYS, hotkeyLabel } from '../../../hotkeys';

interface Props {
  onAddColor: () => void;
  onAddGroup: () => void;
  onSort: () => void;
}

export function PaletteSidebarHeader({ onAddColor, onAddGroup, onSort }: Props) {
  return (
    <Group gap={6} wrap="nowrap">
      <AddItemButton label="Add Color" hint={hotkeyLabel(HOTKEYS.ADD_COLOR)} onClick={onAddColor} style={{ flex: 1 }} />
      <Tooltip label="Sort by color similarity" position="right" withArrow>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          data-testid="sort-palette"
          style={{ border: '1px dashed var(--mantine-color-dark-4)', flexShrink: 0 }}
          onClick={onSort}
        >
          <ArrowUpDown size={15} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Add Group" position="right" withArrow>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          data-testid="add-group"
          style={{ border: '1px dashed var(--mantine-color-dark-4)', flexShrink: 0 }}
          onClick={onAddGroup}
        >
          <FolderPlus size={15} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
