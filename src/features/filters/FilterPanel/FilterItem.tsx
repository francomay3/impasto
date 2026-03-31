import { useState, useCallback } from 'react';
import { Box, Collapse } from '@mantine/core';
import { ChevronDown, ChevronUp, CopyPlus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FilterInstance } from '../../../types';
import { useFilterContext } from '../FilterContext';
import { useContextMenuStore } from '../../../context/contextMenuStore';
import { useContextTrigger } from '../../../hooks/useContextTrigger';
import { FilterWidget } from './FilterWidget';
import { FilterItemHeader } from './FilterItemHeader';

export function FilterItem({ filter }: { filter: FilterInstance }) {
  const {
    filters,
    samplingLevels,
    onRemoveFilter,
    onUpdateFilter,
    onPreviewFilter,
    onStartSamplingLevels,
    onDuplicateFilter,
    onReorderFilters,
  } = useFilterContext();
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: filter.id,
  });
  const openMenu = useContextMenuStore(s => s.open);

  const activeSamplingPoint = samplingLevels?.filterId === filter.id ? samplingLevels.point : null;

  const openContextMenu = useCallback(
    ({ x, y }: { x: number; y: number }) => {
      const idx = filters.findIndex((f) => f.id === filter.id);
      const swap = (a: number, b: number) => {
        const next = [...filters];
        [next[a], next[b]] = [next[b], next[a]];
        onReorderFilters(next);
      };
      openMenu({
        x,
        y,
        items: [
          {
            label: expanded ? 'Collapse' : 'Expand',
            icon: expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />,
            onClick: () => setExpanded((v) => !v),
          },
          { type: 'divider' },
          {
            label: 'Move up',
            icon: <ArrowUp size={14} />,
            onClick: () => swap(idx, idx - 1),
            disabled: idx <= 0,
          },
          {
            label: 'Move down',
            icon: <ArrowDown size={14} />,
            onClick: () => swap(idx, idx + 1),
            disabled: idx >= filters.length - 1,
          },
          { label: 'Duplicate', icon: <CopyPlus size={14} />, onClick: () => onDuplicateFilter(filter.id) },
          { type: 'divider' },
          { label: 'Remove', icon: <Trash2 size={14} />, onClick: () => onRemoveFilter(filter.id), color: 'red' },
        ],
      });
    },
    [filters, filter.id, expanded, openMenu, onReorderFilters, onDuplicateFilter, onRemoveFilter]
  );

  const contextTrigger = useContextTrigger(openContextMenu);

  return (
    <Box
      ref={setNodeRef}
      onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); onRemoveFilter(filter.id); } }}
      {...contextTrigger}
      data-testid="filter-item"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        border: '1px solid var(--mantine-color-dark-5)',
        borderRadius: 6,
        overflow: 'hidden',
        background: 'var(--mantine-color-dark-7)',
        flexShrink: 0,
      }}
    >
      <FilterItemHeader
        filter={filter}
        expanded={expanded}
        isDragging={isDragging}
        attributes={attributes as unknown as Record<string, unknown>}
        listeners={listeners as Record<string, unknown> | undefined}
        onToggleExpand={() => setExpanded((v) => !v)}
        onRemove={() => onRemoveFilter(filter.id)}
      />
      <Collapse in={expanded}>
        <Box p="xs">
          <FilterWidget
            filter={filter}
            onUpdate={(params) => onUpdateFilter(filter.id, params)}
            onPreview={(params) => onPreviewFilter(filter.id, params)}
            samplingLevels={activeSamplingPoint}
            onStartSamplingLevels={(point) => onStartSamplingLevels(filter.id, point)}
          />
        </Box>
      </Collapse>
    </Box>
  );
}
