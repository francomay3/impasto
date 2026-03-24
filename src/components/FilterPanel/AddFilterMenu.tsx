import { Menu, Text } from '@mantine/core';
import { SlidersHorizontal, Palette, Layers, Droplets } from 'lucide-react';
import type { FilterType } from '../../types';
import { FILTER_LABELS } from '../../types';

export const FILTER_ICONS: Record<FilterType, React.ReactNode> = {
  'brightness-contrast': <SlidersHorizontal size={14} />,
  'hue-saturation': <Palette size={14} />,
  'levels': <Layers size={14} />,
  'blur': <Droplets size={14} />,
};

export const FILTER_GROUPS: { label: string; filters: FilterType[] }[] = [
  { label: 'Light & Tone', filters: ['brightness-contrast', 'levels'] },
  { label: 'Color',        filters: ['hue-saturation'] },
  { label: 'Effects',      filters: ['blur'] },
];

interface FilterMenuItemsProps {
  onAdd: (type: FilterType) => void;
}

export function FilterMenuItems({ onAdd }: FilterMenuItemsProps) {
  return (
    <>
      {FILTER_GROUPS.map((group, i) => (
        <div key={group.label}>
          {i > 0 && <Menu.Divider />}
          <Menu.Label>{group.label}</Menu.Label>
          {group.filters.map(type => (
            <Menu.Item key={type} leftSection={FILTER_ICONS[type]} onClick={() => onAdd(type)}>
              <Text size="sm">{FILTER_LABELS[type]}</Text>
            </Menu.Item>
          ))}
        </div>
      ))}
    </>
  );
}
