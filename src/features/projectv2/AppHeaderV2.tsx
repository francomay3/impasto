import { AppShell, Group, Skeleton, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import type { PersistenceStatus } from '../../storage/PersistenceGlue';
import { SaveStatusIndicator } from '../editor/SaveStatusIndicator';
import { EditableTitle } from '../../shared/EditableTitle';
import { UserMenu } from '../../shared/UserMenu';
import { AppHeaderMenusV2 } from './AppHeaderMenusV2';

interface Props {
  projectName: string;
  isLoading: boolean;
  onImportImage: () => void;
  /** Persists dashboard title (Firestore); same contract as legacy `AppHeader` / `EditableTitle`. */
  onRenameProject: (name: string) => void;
  saveStatus: PersistenceStatus;
}

export function AppHeaderV2({ projectName, isLoading, onImportImage, onRenameProject, saveStatus }: Props) {
  const navigate = useNavigate();

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
            {isLoading ? (
              <Skeleton height={20} width={140} mb={4} />
            ) : (
              <EditableTitle name={projectName} onRename={onRenameProject} />
            )}
            <Group gap={0} align="center">
              <AppHeaderMenusV2 onImportImage={onImportImage} />
            </Group>
          </Stack>
          <SaveStatusIndicator status={saveStatus} />
        </Group>
        <Group gap="md">
          <UserMenu />
        </Group>
      </Group>
    </AppShell.Header>
  );
}
