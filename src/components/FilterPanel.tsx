import { Stack, Slider, Text, ActionIcon, Tooltip, Divider } from '@mantine/core';
import { ChevronLeft, ChevronRight, SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { FilterSettings } from '../types';

interface Props {
  filters: FilterSettings;
  onChange: (f: FilterSettings) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function FilterSlider({
  label, value, min, max, onChange, onReset,
}: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; onReset: () => void }) {
  const isAtDefault = value === 0;
  return (
    <Stack gap={2}>
      <Stack gap={0} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text size="xs" c="dimmed">{label}: {value}</Text>
        {!isAtDefault && (
          <Tooltip label={`Reset ${label}`} transitionProps={{ duration: 0 }}>
            <ActionIcon size="xs" variant="subtle" onClick={onReset} color='gray'>
              <RotateCcw size={10} />
            </ActionIcon>
          </Tooltip>
        )}
      </Stack>
      <Slider value={value} min={min} max={max} onChange={onChange} size="xs" />
    </Stack>
  );
}

export function FilterPanel({ filters, onChange, collapsed, onToggleCollapse }: Props) {
  const set = (key: keyof FilterSettings) => (v: number) => onChange({ ...filters, [key]: v });

  if (collapsed) {
    return (
      <Stack align="center" pt="md" gap="xs">
        <Tooltip label="Expand" position="right" transitionProps={{ duration: 0 }}>
          <ActionIcon variant="subtle" onClick={onToggleCollapse} aria-label="Expand panel">
            <ChevronRight size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Image Filters" position="right" transitionProps={{ duration: 0 }}>
          <ActionIcon variant="subtle" onClick={onToggleCollapse} aria-label="Expand filters">
            <SlidersHorizontal size={18} />
          </ActionIcon>
        </Tooltip>
      </Stack>
    );
  }

  return (
    <Stack gap="sm" p="md">
      <Stack gap={4} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Tooltip label="Collapse panel" position="right" transitionProps={{ duration: 0 }}>
          <ActionIcon variant="subtle" onClick={onToggleCollapse} aria-label="Collapse panel">
            <ChevronLeft size={18} />
          </ActionIcon>
        </Tooltip>
      </Stack>
      <Divider color="#222" />
      <Stack gap={4} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack gap={6} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <SlidersHorizontal size={18} />
          <Text fw={600} size="sm">Image Filters</Text>
        </Stack>
      </Stack>
      <FilterSlider label="Brightness" value={filters.brightness} min={-100} max={100} onChange={set('brightness')} onReset={() => set('brightness')(0)} />
      <FilterSlider label="Contrast" value={filters.contrast} min={-100} max={100} onChange={set('contrast')} onReset={() => set('contrast')(0)} />
      <FilterSlider label="Saturation" value={filters.saturation} min={-100} max={100} onChange={set('saturation')} onReset={() => set('saturation')(0)} />
      <FilterSlider label="Temperature" value={filters.temperature} min={-50} max={50} onChange={set('temperature')} onReset={() => set('temperature')(0)} />
      <FilterSlider label="Tint" value={filters.tint} min={-50} max={50} onChange={set('tint')} onReset={() => set('tint')(0)} />
    </Stack>
  );
}
