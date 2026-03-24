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

interface Props {
  filter: FilterInstance;
  onRemove: () => void;
  onUpdate: (params: Record<string, number>) => void;
  samplingLevels: 'black' | 'white' | null;
  onStartSamplingLevels: (point: 'black' | 'white') => void;
}

function FilterWidget({ filter, onUpdate, samplingLevels, onStartSamplingLevels }: Omit<Props, 'onRemove'>) {
  switch (filter.type) {
    case 'brightness-contrast': return <BrightnessContrast params={filter.params as BrightnessContrastParams} onUpdate={onUpdate} />;
    case 'hue-saturation': return <HueSaturation params={filter.params as HueSaturationParams} onUpdate={onUpdate} />;
    case 'levels': return <Levels params={filter.params as LevelsParams} onUpdate={onUpdate} samplingLevels={samplingLevels} onStartSamplingLevels={onStartSamplingLevels} />;
    case 'blur': return <Blur params={filter.params as BlurParams} onUpdate={onUpdate} />;
    default: return null;
  }
}

export function FilterItem({ filter, onRemove, onUpdate, samplingLevels, onStartSamplingLevels }: Props) {
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: filter.id });

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, border: '1px solid #2a2a2a', borderRadius: 6, overflow: 'hidden', background: '#1c1c1c' }}
    >
      <Group px="xs" py={6} gap={4} style={{ background: '#222' }} {...attributes}>
        <ActionIcon size="xs" variant="transparent" color="gray" style={{ cursor: 'grab' }} {...listeners}>
          <GripVertical size={14} />
        </ActionIcon>
        <Text size="xs" fw={500} style={{ flex: 1 }}>{FILTER_LABELS[filter.type]}</Text>
        <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setExpanded(v => !v)}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </ActionIcon>
        <Tooltip label="Remove filter" transitionProps={{ duration: 0 }}>
          <ActionIcon size="xs" variant="subtle" color="red" onClick={onRemove}>
            <Trash2 size={12} />
          </ActionIcon>
        </Tooltip>
      </Group>
      <Collapse in={expanded}>
        <Box p="xs">
          <FilterWidget filter={filter} onUpdate={onUpdate} samplingLevels={samplingLevels} onStartSamplingLevels={onStartSamplingLevels} />
        </Box>
      </Collapse>
    </Box>
  );
}
