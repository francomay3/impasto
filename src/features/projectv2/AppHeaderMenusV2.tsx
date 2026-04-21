import { Menu, Text, UnstyledButton } from '@mantine/core';
import { MANTINE_MENU_CLICK_OUTSIDE_EVENTS } from '../../shared/mantineMenuClickOutsideEvents';

interface MenuButtonProps {
  label: string;
  children: React.ReactNode;
}

interface AppHeaderMenusV2Props {
  onImportImage: () => void;
}

function MenuButton({ label, children }: MenuButtonProps) {
  return (
    <Menu shadow="md" width={200} position="bottom-start" offset={4} clickOutsideEvents={MANTINE_MENU_CLICK_OUTSIDE_EVENTS}>
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

export function AppHeaderMenusV2({ onImportImage }: AppHeaderMenusV2Props) {
  return (
    <>
      <MenuButton label="File">
        <Menu.Item disabled>New Project</Menu.Item>
        <Menu.Item disabled>Open…</Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={onImportImage}>Import Image…</Menu.Item>
        <Menu.Divider />
        <Menu.Item disabled>Save</Menu.Item>
        <Menu.Item disabled>Export PDF</Menu.Item>
        <Menu.Divider />
        <Menu.Item disabled>Recent Projects</Menu.Item>
      </MenuButton>
      <MenuButton label="Edit">
        <Menu.Item disabled rightSection={<Text size="xs" c="dimmed">⌘Z</Text>}>
          Undo
        </Menu.Item>
        <Menu.Item disabled rightSection={<Text size="xs" c="dimmed">⌘⇧Z</Text>}>
          Redo
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item disabled>Reset to Original</Menu.Item>
        <Menu.Item disabled>Clear Palette</Menu.Item>
        <Menu.Divider />
        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item>Add Filter</Menu.Sub.Item>
          </Menu.Sub.Target>
          <Menu.Sub.Dropdown>
            <Menu.Item disabled>Add Filter…</Menu.Item>
          </Menu.Sub.Dropdown>
        </Menu.Sub>
        <Menu.Item disabled>Add Color to Palette</Menu.Item>
      </MenuButton>
      <MenuButton label="Help">
        <Menu.Item disabled rightSection={<Text size="xs" c="dimmed">?</Text>}>
          Keyboard Shortcuts
        </Menu.Item>
        <Menu.Item disabled>Documentation</Menu.Item>
        <Menu.Divider />
        <Menu.Item disabled>
          <Text size="xs" c="dimmed">
            Impasto v0.1
          </Text>
        </Menu.Item>
      </MenuButton>
    </>
  );
}
