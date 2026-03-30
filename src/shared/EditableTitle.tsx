import { useState } from 'react';
import { Box, Text, TextInput } from '@mantine/core';

interface Props {
  name: string;
  onRename: (name: string) => void;
}

export function EditableTitle({ name, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  const commit = () => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    else setValue(name);
  };

  if (editing) {
    return (
      <Box data-testid="project-title">
        <TextInput
          value={value}
          onChange={e => setValue(e.currentTarget.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setValue(name); setEditing(false); }
          }}
          autoFocus
          size="xs"
          style={{ width: Math.max(140, value.length * 9) }}
          styles={{ input: { fontWeight: 600, fontSize: 15, padding: '2px 6px' } }}
        />
      </Box>
    );
  }

  return (
    <Text
      size="sm"
      fw={600}
      data-testid="project-title"
      onClick={() => { setValue(name); setEditing(true); }}
      style={{
        cursor: 'text',
        padding: '2px 6px',
        borderRadius: 4,
        maxWidth: 320,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={name}
    >
      {name}
    </Text>
  );
}
