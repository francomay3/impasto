import { useClickOutside } from '@mantine/hooks';
import { TextInput, Select, Stack } from '@mantine/core';
import type { ColorGroup } from '../types';

interface Props {
  name: string;
  hex: string;
  groupId: string | null;
  groups: ColorGroup[];
  onNameChange: (name: string) => void;
  onGroupChange: (groupId: string | null) => void;
  onCommit: () => void;
  onCancel: () => void;
}

export function PinPopover({ name, hex, groupId, groups, onNameChange, onGroupChange, onCommit, onCancel }: Props) {
  const ref = useClickOutside<HTMLDivElement>(onCommit);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') onCommit();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <Stack ref={ref} gap="xs" onMouseDown={(e) => e.stopPropagation()}>
      <TextInput
        size="xs"
        placeholder={hex}
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <Select
        size="xs"
        placeholder="No group"
        value={groupId}
        onChange={onGroupChange}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
          e.stopPropagation();
        }}
        data={groups.map((g) => ({ value: g.id, label: g.name }))}
        clearable
      />
    </Stack>
  );
}
