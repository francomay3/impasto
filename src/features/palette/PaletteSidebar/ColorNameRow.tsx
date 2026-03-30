import { Box, Text, TextInput } from '@mantine/core';
import { GripVertical } from 'lucide-react';
import type { Color } from '../../../types';

interface Props {
  color: Color;
  editingName: boolean;
  editNameValue: string;
  dragHandleRef?: (el: HTMLElement | null) => void;
  dragListeners?: Record<string, (...args: unknown[]) => void>;
  onEditNameChange: (val: string) => void;
  onEditNameSubmit: () => void;
  onEditNameCancel: () => void;
  onStartEditing: () => void;
}

export function ColorNameRow({
  color,
  editingName,
  editNameValue,
  dragHandleRef,
  dragListeners,
  onEditNameChange,
  onEditNameSubmit,
  onEditNameCancel,
  onStartEditing,
}: Props) {
  return (
    <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Box
        ref={dragHandleRef}
        {...dragListeners}
        style={{
          color: 'var(--mantine-color-dark-3)',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          cursor: 'grab',
          touchAction: 'none',
        }}
      >
        <GripVertical size={14} />
      </Box>
      <Box
        style={{
          width: 26,
          height: 26,
          flexShrink: 0,
          borderRadius: 4,
          background: color.hex,
          border: '1px solid var(--mantine-color-dark-3)',
        }}
      />
      {editingName ? (
        <TextInput
          value={editNameValue}
          onChange={(e) => onEditNameChange(e.currentTarget.value)}
          onBlur={onEditNameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditNameSubmit();
            if (e.key === 'Escape') onEditNameCancel();
          }}
          size="xs"
          autoFocus
          style={{ flex: 1 }}
        />
      ) : (
        <Text
          size="xs"
          ff={color.name ? undefined : 'monospace'}
          onClick={onStartEditing}
          data-testid="color-name"
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'text',
          }}
        >
          {color.name || color.hex.toLowerCase()}
        </Text>
      )}
    </Box>
  );
}
