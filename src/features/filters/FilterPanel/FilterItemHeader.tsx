import { Group, Box, Text, ActionIcon, Tooltip } from '@mantine/core';
import { GripVertical, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { FilterInstance } from '../../../types';
import { FILTER_LABELS } from '../../../types';

interface Props {
  filter: FilterInstance;
  expanded: boolean;
  isDragging: boolean;
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown> | undefined;
  onToggleExpand: () => void;
  onRemove: () => void;
}

export function FilterItemHeader({
  filter,
  expanded,
  isDragging,
  attributes,
  listeners,
  onToggleExpand,
  onRemove,
}: Props) {
  return (
    <Group
      px="xs"
      py={6}
      gap={4}
      {...attributes}
      {...listeners}
      onDoubleClick={onToggleExpand}
      style={{
        background: 'var(--mantine-color-dark-6)',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <Box
        style={{ color: 'var(--mantine-color-dark-3)', display: 'flex', alignItems: 'center' }}
      >
        <GripVertical size={14} />
      </Box>
      <Text size="xs" fw={500} style={{ flex: 1 }}>
        {FILTER_LABELS[filter.type]}
      </Text>
      <ActionIcon
        size="xs"
        variant="subtle"
        color="gray"
        data-testid="filter-toggle"
        onClick={onToggleExpand}
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </ActionIcon>
      <Tooltip label="Remove filter" transitionProps={{ duration: 0 }}>
        <ActionIcon
          size="xs"
          variant="subtle"
          color="red"
          data-testid="filter-remove"
          onClick={onRemove}
        >
          <Trash2 size={12} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
