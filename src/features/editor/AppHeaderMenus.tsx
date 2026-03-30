import { Menu, Text, UnstyledButton } from '@mantine/core';
import { Plus } from 'lucide-react';
import { FilterMenuItems } from '../filters/FilterPanel/AddFilterMenu';
import type { FilterType } from '../../types';

interface MenuButtonProps {
  label: string;
  children: React.ReactNode;
}

function MenuButton({ label, children }: MenuButtonProps) {
  return (
    <Menu shadow="md" width={200} position="bottom-start" offset={4}>
      <Menu.Target>
        <UnstyledButton
          px={8}
          py={3}
          style={{ borderRadius: 4, fontSize: 13, color: 'var(--mantine-color-dark-1)' }}
          className="header-menu-btn"
        >
          {label}
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>{children}</Menu.Dropdown>
    </Menu>
  );
}

interface Props {
  hasImage: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onExportClick: () => void;
  onReplaceImage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddFilter: (type: FilterType) => void;
  onAddColor: () => void;
  onOpenShortcuts: () => void;
}

export function AppHeaderMenus({
  hasImage,
  canUndo,
  canRedo,
  onExportClick,
  onReplaceImage,
  onUndo,
  onRedo,
  onAddFilter,
  onAddColor,
  onOpenShortcuts,
}: Props) {
  return (
    <>
      <MenuButton label="File">
        <Menu.Item disabled>New Project</Menu.Item>
        <Menu.Item disabled>Open…</Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={onReplaceImage}>Import Image…</Menu.Item>
        <Menu.Divider />
        <Menu.Item disabled>Save</Menu.Item>
        <Menu.Item disabled={!hasImage} onClick={hasImage ? onExportClick : undefined}>Export PDF</Menu.Item>
        <Menu.Divider />
        <Menu.Item disabled>Recent Projects</Menu.Item>
      </MenuButton>
      <MenuButton label="Edit">
        <Menu.Item disabled={!canUndo} onClick={onUndo} rightSection={<Text size="xs" c="dimmed">⌘Z</Text>}>Undo</Menu.Item>
        <Menu.Item disabled={!canRedo} onClick={onRedo} rightSection={<Text size="xs" c="dimmed">⌘⇧Z</Text>}>Redo</Menu.Item>
        <Menu.Divider />
        <Menu.Item disabled>Reset to Original</Menu.Item>
        <Menu.Item disabled>Clear Palette</Menu.Item>
        <Menu.Divider />
        <Menu.Sub>
          <Menu.Sub.Target><Menu.Sub.Item>Add Filter</Menu.Sub.Item></Menu.Sub.Target>
          <Menu.Sub.Dropdown><FilterMenuItems onAdd={onAddFilter} /></Menu.Sub.Dropdown>
        </Menu.Sub>
        <Menu.Item leftSection={<Plus size={14} />} onClick={onAddColor}>Add Color to Palette</Menu.Item>
      </MenuButton>
      <MenuButton label="Help">
        <Menu.Item onClick={onOpenShortcuts} rightSection={<Text size="xs" c="dimmed">?</Text>}>Keyboard Shortcuts</Menu.Item>
        <Menu.Item disabled>Documentation</Menu.Item>
        <Menu.Divider />
        <Menu.Item disabled><Text size="xs" c="dimmed">Impasto v0.1</Text></Menu.Item>
      </MenuButton>
    </>
  );
}
