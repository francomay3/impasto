import { Box, Text, TextInput } from '@mantine/core';

interface Props {
  editing: boolean;
  editName: string;
  groupName: string;
  colorCount: number;
  onChange: (name: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function GroupNameEditor({ editing, editName, groupName, colorCount, onChange, onSubmit, onCancel }: Props) {
  if (editing) {
    return (
      <TextInput
        value={editName}
        onChange={(e) => onChange(e.currentTarget.value)}
        onBlur={onSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        onFocus={(e) => e.currentTarget.select()}
        size="xs"
        autoFocus
        style={{ flex: 1 }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <Box style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
      <Text size="xs" fw={600} c="dimmed" data-testid="group-name" style={{ userSelect: 'none' }}>
        {groupName}
      </Text>
      {colorCount === 0 && (
        <Text size="xs" c="dimmed" style={{ fontStyle: 'italic', opacity: 0.5 }}>empty</Text>
      )}
    </Box>
  );
}
