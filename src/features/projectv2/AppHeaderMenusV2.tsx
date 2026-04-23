import { useState } from 'react';
import { Menu, UnstyledButton } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { MANTINE_MENU_CLICK_OUTSIDE_EVENTS } from '../../shared/mantineMenuClickOutsideEvents';
import { HOTKEYS } from '../../hotkeys';
import { useProjects } from '../dashboard/useProjects';
import { OpenProjectModal } from './OpenProjectModal';
import { EditMenuV2 } from './EditMenuV2';
import { HelpMenuV2 } from './HelpMenuV2';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';

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
  const navigate = useNavigate();
  const { create, isCreating } = useProjects();
  const [openProjectModalOpen, setOpenProjectModalOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Modal + hotkey live at this level (not inside HelpMenuV2) because Menu.Dropdown
  // unmounts its children when closed, which would unmount the modal and its listener.
  useHotkeys([[HOTKEYS.SHOW_SHORTCUTS, () => setShortcutsOpen(true)]]);

  return (
    <>
      <OpenProjectModal opened={openProjectModalOpen} onClose={() => setOpenProjectModalOpen(false)} />
      <KeyboardShortcutsModal opened={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <MenuButton label="File">
        <Menu.Item
          disabled={isCreating}
          onClick={async () => {
            const id = await create();
            navigate(`/projectv2/${id}`);
          }}
        >
          New Project
        </Menu.Item>
        <Menu.Item onClick={() => setOpenProjectModalOpen(true)}>Open…</Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={onImportImage}>Import Image…</Menu.Item>
        <Menu.Divider />
        <Menu.Item disabled>Export PDF</Menu.Item>
      </MenuButton>
      <MenuButton label="Edit">
        <EditMenuV2 />
      </MenuButton>
      <MenuButton label="Help">
        <HelpMenuV2 onOpenShortcuts={() => setShortcutsOpen(true)} />
      </MenuButton>
    </>
  );
}
