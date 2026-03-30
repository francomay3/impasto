import { Menu, Text } from '@mantine/core';
import type { FilterType } from '../../../types';
import { FILTER_LABELS } from '../../../types';
import { FILTER_ICONS, FILTER_GROUPS } from './filterMenuData';

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
          {group.filters.map((type) => (
            <Menu.Item key={type} leftSection={FILTER_ICONS[type]} onClick={() => onAdd(type)}>
              <Text size="sm">{FILTER_LABELS[type]}</Text>
            </Menu.Item>
          ))}
        </div>
      ))}
    </>
  );
}
