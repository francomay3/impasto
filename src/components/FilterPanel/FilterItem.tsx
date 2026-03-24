import { useState } from 'react';
import { Box, Group, ActionIcon, Text, Tooltip, Collapse } from '@mantine/core';
import { GripVertical, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FilterInstance, BrightnessContrastParams, HueSaturationParams, LevelsParams, BlurParams } from '../../types';
import { FILTER_LABELS } from '../../types';
import { BrightnessContrast } from './widgets/BrightnessContrast';
import { HueSaturation } from './widgets/HueSaturation';
import { Levels } from './widgets/Levels';
import { Blur } from './widgets/Blur';
import { useFilterContext } from '../../context/FilterContext';

interface FilterWidgetProps {
  filter: FilterInstance;
  onUpdate: (params: Record<string, number>) => void;
  onPreview: (params: Record<string, number>) => void;
  samplingLevels: 'black' | 'white' | null;
  onStartSamplingLevels: (point: 'black' | 'white') => void;
}

function FilterWidget({ filter, onUpdate, onPreview, samplingLevels, onStartSamplingLevels }: FilterWidgetProps) {
  switch (filter.type) {
    case 'brightness-contrast': return <BrightnessContrast params={filter.params as BrightnessContrastParams} onUpdate={onUpdate} onPreview={onPreview} />;
    case 'hue-saturation': return <HueSaturation params={filter.params as HueSaturationParams} onUpdate={onUpdate} onPreview={onPreview} />;
    case 'levels': return <Levels params={filter.params as LevelsParams} onUpdate={onUpdate} samplingLevels={samplingLevels} onStartSamplingLevels={onStartSamplingLevels} />;
    case 'blur': return <Blur params={filter.params as BlurParams} onUpdate={onUpdate} onPreview={onPreview} />;
    default: return null;
  }
}

export function FilterItem({ filter }: { filter: FilterInstance }) {
  const { samplingLevels, onRemoveFilter, onUpdateFilter, onPreviewFilter, onStartSamplingLevels } = useFilterContext();
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: filter.id });

  const handleAuxClick = (e: React.MouseEvent) => {
    if (e.button === 1) { e.preventDefault(); onRemoveFilter(filter.id); }
  };

  const activeSamplingPoint = samplingLevels?.filterId === filter.id ? samplingLevels.point : null;

  return (
    <Box ref={setNodeRef} onMouseDown={handleAuxClick}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, border: '1px solid var(--mantine-color-dark-5)', borderRadius: 6, overflow: 'hidden', background: 'var(--mantine-color-dark-7)' }}
    >
      <Group px="xs" py={6} gap={4} style={{ background: 'var(--mantine-color-dark-6)' }} {...attributes}>
        <ActionIcon size="xs" variant="transparent" color="gray" style={{ cursor: 'grab' }} {...listeners}>
          <GripVertical size={14} />
        </ActionIcon>
        <Text size="xs" fw={500} style={{ flex: 1 }}>{FILTER_LABELS[filter.type]}</Text>
        <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setExpanded(v => !v)}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </ActionIcon>
        <Tooltip label="Remove filter" transitionProps={{ duration: 0 }}>
          <ActionIcon size="xs" variant="subtle" color="red" onClick={() => onRemoveFilter(filter.id)}>
            <Trash2 size={12} />
          </ActionIcon>
        </Tooltip>
      </Group>
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
