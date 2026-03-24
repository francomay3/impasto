import { AppShell, Group, Menu, Stack, Text, UnstyledButton } from '@mantine/core';
import { SlidersHorizontal, Palette, Layers, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EditableTitle } from './EditableTitle';
import { UserMenu } from './UserMenu';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import type { FilterType } from '../types';
import { FILTER_LABELS } from '../types';
import type { SaveStatus } from '../hooks/useSaveStatus';

const FILTER_ICONS: Record<FilterType, React.ReactNode> = {
  'brightness-contrast': <SlidersHorizontal size={14} />,
  'hue-saturation': <Palette size={14} />,
  'levels': <Layers size={14} />,
  'blur': <Droplets size={14} />,
};

const FILTER_GROUPS: { label: string; filters: FilterType[] }[] = [
  { label: 'Light & Tone', filters: ['brightness-contrast', 'levels'] },
  { label: 'Color', filters: ['hue-saturation'] },
  { label: 'Effects', filters: ['blur'] },
];

interface Props {
  projectName: string;
  hasImage: boolean;
  onExportClick: () => void;
  onRename: (name: string) => void;
  onAddFilter?: (type: FilterType) => void;
  onAddColor?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: SaveStatus;
}

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

export function AppHeader({ projectName, hasImage, onExportClick, onRename, onAddFilter, onAddColor, onUndo, onRedo, canUndo, canRedo, saveStatus }: Props) {
  const navigate = useNavigate();
  return (
    <AppShell.Header style={{ background: 'var(--mantine-color-dark-9)', borderBottom: '1px solid var(--mantine-color-dark-6)' }}>
      <style>{`.header-menu-btn:hover { background: var(--mantine-color-dark-6); }`}</style>
      <Group justify="space-between" align="center" style={{ height: '100%', flex: 1 }} px="md">
        <Group gap="sm" align="center">
          <img src="/brush.svg" width={36} height={36} style={{ flexShrink: 0, cursor: 'pointer' }} onClick={() => navigate('/')} />
          <Stack gap={0} justify="center">
            <EditableTitle name={projectName} onRename={onRename} />
            <Group gap={0} align="center">
              <MenuButton label="File">
                <Menu.Item disabled>New Project</Menu.Item>
                <Menu.Item disabled>Open…</Menu.Item>
                <Menu.Divider />
                <Menu.Item disabled>Import Image…</Menu.Item>
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
                    <Menu.Sub.Item disabled={!onAddFilter}>
                      Add Filter
                    </Menu.Sub.Item>
                  </Menu.Sub.Target>
                  <Menu.Sub.Dropdown>
                    {FILTER_GROUPS.map((group, i) => (
                      <div key={group.label}>
                        {i > 0 && <Menu.Divider />}
                        <Menu.Label>{group.label}</Menu.Label>
                        {group.filters.map(type => (
                          <Menu.Item key={type} leftSection={FILTER_ICONS[type]} onClick={() => onAddFilter?.(type)}>
                            <Text size="sm">{FILTER_LABELS[type]}</Text>
                          </Menu.Item>
                        ))}
                      </div>
                    ))}
                  </Menu.Sub.Dropdown>
                </Menu.Sub>
                <Menu.Item disabled={!onAddColor} onClick={onAddColor}>
                  Add Color to Palette
                </Menu.Item>
              </MenuButton>
              <MenuButton label="Help">
                <Menu.Item disabled>Keyboard Shortcuts</Menu.Item>
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
    </AppShell.Header>
  );
}
