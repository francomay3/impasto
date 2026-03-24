import { Stack, Slider, Text, ActionIcon, Tooltip, Divider, Box, Group } from '@mantine/core';
import { ChevronLeft, ChevronRight, SlidersHorizontal, RotateCcw, Pipette, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FilterSettings } from '../types';

interface Props {
  filters: FilterSettings;
  onChange: (f: FilterSettings) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onStartSamplingLevels?: (point: 'black' | 'white') => void;
  samplingLevels?: 'black' | 'white' | null;
}

const NAV_SECTIONS = [
  { label: 'Image Filters', icon: SlidersHorizontal },
  { label: 'Levels', icon: Layers },
] as const;

function SectionHeader({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <Stack gap={6} style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Icon size={18} />
      <Text fw={600} size="sm">{label}</Text>
    </Stack>
  );
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

function LevelPoint({
  label, value, isDefault, isSampling, onSample, onReset,
}: {
  label: string;
  value: number;
  isDefault: boolean;
  isSampling: boolean;
  onSample: () => void;
  onReset: () => void;
}) {
  const shade = Math.round(value);
  const swatchColor = `rgb(${shade},${shade},${shade})`;
  return (
    <Group gap={6} wrap="nowrap" align="center">
      <Box
        style={{
          width: 18,
          height: 18,
          borderRadius: 3,
          background: swatchColor,
          border: '1px solid #444',
          flexShrink: 0,
        }}
      />
      <Text size="xs" c="dimmed" style={{ flex: 1 }}>{label}: {value}</Text>
      <Tooltip label={`Sample ${label} from image`} transitionProps={{ duration: 0 }}>
        <ActionIcon
          size="xs"
          variant={isSampling ? 'filled' : 'subtle'}
          color={isSampling ? 'cyan' : 'gray'}
          onClick={onSample}
        >
          <Pipette size={10} />
        </ActionIcon>
      </Tooltip>
      {!isDefault && (
        <Tooltip label={`Reset ${label}`} transitionProps={{ duration: 0 }}>
          <ActionIcon size="xs" variant="subtle" color="gray" onClick={onReset}>
            <RotateCcw size={10} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}

export function FilterPanel({ filters, onChange, collapsed, onToggleCollapse, onStartSamplingLevels, samplingLevels }: Props) {
  const set = (key: keyof FilterSettings) => (v: number) => onChange({ ...filters, [key]: v });

  if (collapsed) {
    return (
      <Stack align="center" pt="md" gap="xs">
        <Tooltip label="Expand" position="right" transitionProps={{ duration: 0 }}>
          <ActionIcon variant="subtle" onClick={onToggleCollapse} aria-label="Expand panel" color='gray'>
            <ChevronRight size={18} />
          </ActionIcon>
        </Tooltip>
        {NAV_SECTIONS.map(({ label, icon: Icon }) => (
          <Tooltip key={label} label={label} position="right" transitionProps={{ duration: 0 }}>
            <ActionIcon variant="subtle" onClick={onToggleCollapse} color='gray'>
              <Icon size={18} />
            </ActionIcon>
          </Tooltip>
        ))}
      </Stack>
    );
  }

  return (
    <Stack gap="sm" p="md">
      <Stack gap={4} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Tooltip label="Collapse panel" position="right" transitionProps={{ duration: 0 }}>
          <ActionIcon variant="subtle" onClick={onToggleCollapse} aria-label="Collapse panel" color='gray'>
            <ChevronLeft size={18} />
          </ActionIcon>
        </Tooltip>
      </Stack>
      <Divider color="#222" />
      <Stack gap={4} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader label={NAV_SECTIONS[0].label} icon={NAV_SECTIONS[0].icon} />
      </Stack>
      <FilterSlider label="Brightness" value={filters.brightness} min={-100} max={100} onChange={set('brightness')} onReset={() => set('brightness')(0)} />
      <FilterSlider label="Contrast" value={filters.contrast} min={-100} max={100} onChange={set('contrast')} onReset={() => set('contrast')(0)} />
      <FilterSlider label="Saturation" value={filters.saturation} min={-100} max={100} onChange={set('saturation')} onReset={() => set('saturation')(0)} />
      <FilterSlider label="Temperature" value={filters.temperature} min={-50} max={50} onChange={set('temperature')} onReset={() => set('temperature')(0)} />
      <FilterSlider label="Tint" value={filters.tint} min={-50} max={50} onChange={set('tint')} onReset={() => set('tint')(0)} />
      <Divider color="#222" />
      <SectionHeader label={NAV_SECTIONS[1].label} icon={NAV_SECTIONS[1].icon} />
      <LevelPoint
        label="Black Point"
        value={filters.blackPoint}
        isDefault={filters.blackPoint === 0}
        isSampling={samplingLevels === 'black'}
        onSample={() => onStartSamplingLevels?.('black')}
        onReset={() => onChange({ ...filters, blackPoint: 0 })}
      />
      <LevelPoint
        label="White Point"
        value={filters.whitePoint}
        isDefault={filters.whitePoint === 255}
        isSampling={samplingLevels === 'white'}
        onSample={() => onStartSamplingLevels?.('white')}
        onReset={() => onChange({ ...filters, whitePoint: 255 })}
      />
    </Stack>
  );
}
