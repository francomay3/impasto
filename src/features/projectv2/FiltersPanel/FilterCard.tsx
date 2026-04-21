import { Box, Text, ActionIcon } from '@mantine/core';
import { GripVertical, Eye, EyeOff, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FilterInstance } from '../../../types';
import { FILTER_LABELS } from '../../../types';
import { FilterWidgetDispatch } from './FilterWidgetDispatch';

interface SortableFilterCardProps {
  filter: FilterInstance;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (partial: Record<string, number>) => void;
}

export function SortableFilterCard({ filter, onToggle, onRemove, onUpdate }: SortableFilterCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: filter.id });
  const enabled = filter.enabled !== false;

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      <Box
        style={{
          background: 'var(--mantine-color-dark-7)',
          border: '1px solid var(--mantine-color-dark-4)',
          borderRadius: 6,
        }}
      >
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: 8,
          }}
        >
          <Box
            ref={setActivatorNodeRef}
            {...listeners}
            style={{
              color: 'var(--mantine-color-dark-3)',
              display: 'flex',
              alignItems: 'center',
              cursor: 'grab',
              touchAction: 'none',
              flexShrink: 0,
            }}
          >
            <GripVertical size={14} />
          </Box>
          <Text size="sm" style={{ flex: 1, minWidth: 0 }}>
            {FILTER_LABELS[filter.type]}
          </Text>
          <ActionIcon size="xs" variant="subtle" color="gray" onClick={onToggle}>
            {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
          </ActionIcon>
          <ActionIcon size="xs" variant="subtle" color="red" onClick={onRemove}>
            <X size={14} />
          </ActionIcon>
        </Box>
        <Box px={8} pb={8} pt={4}>
          <FilterWidgetDispatch filter={filter} onCommit={onUpdate} />
        </Box>
      </Box>
    </Box>
  );
}
