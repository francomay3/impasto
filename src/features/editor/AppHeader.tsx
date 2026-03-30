import { AppShell, Group, Menu, Skeleton, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EditableTitle } from '../../shared/EditableTitle';
import { UserMenu } from '../../shared/UserMenu';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { FilterMenuItems } from '../filters/FilterPanel/AddFilterMenu';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { useEditorContext } from './EditorContext';
import { useFilterContext } from '../filters/FilterContext';
import { usePaletteContext } from '../palette/PaletteContext';
import { HOTKEYS } from '../../hotkeys';

function MenuButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Menu shadow="md" width={200} position="bottom-start" offset={4}>
      <Menu.Target>
        <UnstyledButton
          px={8}
          py={3}
          style={{
            borderRadius: 4,
            fontSize: 13,
            color: 'var(--mantine-color-dark-1)',
          }}
          className="header-menu-btn"
        >
          {label}
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>{children}</Menu.Dropdown>
    </Menu>
  );
}

export function AppHeader() {
  const navigate = useNavigate();
  const { projectName, hasImage, onExportClick, onReplaceImage, onRename, onUndo, onRedo, canUndo, canRedo, saveStatus, isLoading } = useEditorContext();
  const { onAddFilter } = useFilterContext();
  const { onAddColor } = usePaletteContext();
  const [shortcutsOpened, { open: openShortcuts, close: closeShortcuts }] = useDisclosure(false);
  useHotkeys([[HOTKEYS.SHOW_SHORTCUTS, openShortcuts]]);
  return (
    <AppShell.Header style={{ background: 'var(--mantine-color-dark-9)', borderBottom: '1px solid var(--mantine-color-dark-6)' }}>
      <style>{`.header-menu-btn:hover { background: var(--mantine-color-dark-6); }`}</style>
      <Group justify="space-between" align="center" style={{ height: '100%', flex: 1 }} px="md">
        <Group gap="sm" align="center">
          <img src="/brush.svg" width={36} height={36} style={{ flexShrink: 0, cursor: 'pointer' }} onClick={() => navigate('/')} />
          <Stack gap={0} justify="center">
            {isLoading ? <Skeleton height={20} width={140} mb={4} /> : <EditableTitle name={projectName} onRename={onRename} />}
            <Group gap={0} align="center">
              <MenuButton label="File">
                <Menu.Item disabled>New Project</Menu.Item>
                <Menu.Item disabled>Open…</Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={onReplaceImage}>Import Image…</Menu.Item>
                <Menu.Divider />
                <Menu.Item disabled>Save</Menu.Item>
                <Menu.Item disabled={!hasImage} onClick={hasImage ? onExportClick : undefined}>
                  Export PDF
                </Menu.Item>
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
                  <Menu.Sub.Target>
                    <Menu.Sub.Item>
                      Add Filter
                    </Menu.Sub.Item>
                  </Menu.Sub.Target>
                  <Menu.Sub.Dropdown>
                    <FilterMenuItems onAdd={onAddFilter} />
                  </Menu.Sub.Dropdown>
                </Menu.Sub>
                <Menu.Item leftSection={<Plus size={14} />} onClick={onAddColor}>
                  Add Color to Palette
                </Menu.Item>
              </MenuButton>
              <MenuButton label="Help">
                <Menu.Item onClick={openShortcuts} rightSection={<Text size="xs" c="dimmed">?</Text>}>Keyboard Shortcuts</Menu.Item>
                <Menu.Item disabled>Documentation</Menu.Item>
                <Menu.Divider />
                <Menu.Item disabled>
                  <Text size="xs" c="dimmed">Impasto v0.1</Text>
                </Menu.Item>
              </MenuButton>
            </Group>
          </Stack>
          <SaveStatusIndicator status={saveStatus} />
        </Group>
        <Group gap="md">
          <UserMenu />
        </Group>
      </Group>
      <KeyboardShortcutsModal opened={shortcutsOpened} onClose={closeShortcuts} />
    </AppShell.Header>
  );
}
