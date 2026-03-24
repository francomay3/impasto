import { Menu, Text } from '@mantine/core';
import { SlidersHorizontal, Palette, Layers, Droplets } from 'lucide-react';
import type { FilterType } from '../../types';
import { FILTER_LABELS } from '../../types';
import { AddItemButton } from '../AddItemButton';

const FILTER_ICONS: Record<FilterType, React.ReactNode> = {
  'brightness-contrast': <SlidersHorizontal size={14} />,
  'hue-saturation': <Palette size={14} />,
  'levels': <Layers size={14} />,
  'blur': <Droplets size={14} />,
};

const FILTER_ORDER: FilterType[] = ['brightness-contrast', 'hue-saturation', 'levels', 'blur'];

interface Props {
  onAdd: (type: FilterType) => void;
}

export function AddFilterMenu({ onAdd }: Props) {
  return (
    <Menu shadow="md" width={210} position="bottom-start">
      <Menu.Target>
        <AddItemButton label="Add Filter" />
      </Menu.Target>
      <Menu.Dropdown style={{ background: 'var(--mantine-color-dark-7)', border: '1px solid var(--mantine-color-dark-4)' }}>
        {FILTER_ORDER.map(type => (
          <Menu.Item key={type} leftSection={FILTER_ICONS[type]} onClick={() => onAdd(type)}>
            <Text size="sm">{FILTER_LABELS[type]}</Text>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
