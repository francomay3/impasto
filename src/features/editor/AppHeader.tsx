import { AppShell, Group, Skeleton, Stack } from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { EditableTitle } from '../../shared/EditableTitle';
import { UserMenu } from '../../shared/UserMenu';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { AppHeaderMenus } from './AppHeaderMenus';
import { useEditorContext } from './EditorContext';
import { useFilterContext } from '../filters/FilterContext';
import { usePaletteContext } from '../palette/PaletteContext';
import { HOTKEYS } from '../../hotkeys';

export function AppHeader() {
  const navigate = useNavigate();
  const {
    projectName,
    hasImage,
    onExportClick,
    onReplaceImage,
    onRename,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    saveStatus,
    isLoading,
  } = useEditorContext();
  const { onAddFilter } = useFilterContext();
  const { onAddColor } = usePaletteContext();
  const [shortcutsOpened, { open: openShortcuts, close: closeShortcuts }] = useDisclosure(false);
  useHotkeys([[HOTKEYS.SHOW_SHORTCUTS, openShortcuts]]);

  return (
    <AppShell.Header style={{ background: 'var(--mantine-color-dark-9)', borderBottom: '1px solid var(--mantine-color-dark-6)' }}>
      <style>{`.header-menu-btn:hover { background: var(--mantine-color-dark-6); }`}</style>
      <Group justify="space-between" align="center" style={{ height: '100%', flex: 1 }} px="md">
        <Group gap="sm" align="center">
          <img
            src="/brush.svg"
            width={36}
            height={36}
            style={{ flexShrink: 0, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          />
          <Stack gap={0} justify="center">
            {isLoading ? <Skeleton height={20} width={140} mb={4} /> : <EditableTitle name={projectName} onRename={onRename} />}
            <Group gap={0} align="center">
              <AppHeaderMenus
                hasImage={hasImage}
                canUndo={canUndo}
                canRedo={canRedo}
                onExportClick={onExportClick}
                onReplaceImage={onReplaceImage}
                onUndo={onUndo}
                onRedo={onRedo}
                onAddFilter={onAddFilter}
                onAddColor={onAddColor}
                onOpenShortcuts={openShortcuts}
              />
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
