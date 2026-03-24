import { Menu } from '@mantine/core';
import type { FilterType } from '../types';
import { FilterMenuItems } from './FilterPanel/AddFilterMenu';

interface Props {
  opened: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAdd: (type: FilterType) => void;
}

export function FilterContextMenu({ opened, position, onClose, onAdd }: Props) {
  return (
    <Menu opened={opened} onChange={open => !open && onClose()} shadow="md" width={210} position="bottom-start">
      <Menu.Target>
        <div style={{ position: 'fixed', left: position.x, top: position.y, width: 0, height: 0 }} />
      </Menu.Target>
      <Menu.Dropdown style={{ background: 'var(--mantine-color-dark-7)', border: '1px solid var(--mantine-color-dark-4)' }}>
        <FilterMenuItems onAdd={onAdd} />
      </Menu.Dropdown>
    </Menu>
  );
}
