import { Card, Text, ActionIcon, Group, Stack, Menu } from '@mantine/core';
import { MoreHorizontal, FolderOpen, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ProjectState } from '../../types';

interface Props {
  project: ProjectState;
  onDelete: (id: string) => void;
}

function PaletteThumbnail({ palette }: { palette: ProjectState['palette'] }) {
  if (palette.length === 0) {
    return <div style={{ flex: 1, background: 'var(--mantine-color-dark-6)' }} />;
  }
  return (
    <>
      {palette.map(c => (
        <div key={c.id} style={{ flex: 1, background: c.hex }} />
      ))}
    </>
  );
}

export function ProjectCard({ project, onDelete }: Props) {
  const navigate = useNavigate();
  const date = new Date(project.updatedAt).toLocaleDateString();

  const open = () => navigate(`/project/${project.id}`);

  return (
    <Card
      radius="md"
      padding="sm"
      style={{
        background: 'var(--mantine-color-dark-7)',
        border: '1px solid var(--mantine-color-dark-5)',
        cursor: 'pointer',
        transition: 'border-color 120ms',
      }}
      onClick={open}
    >
      <Card.Section style={{ height: 100, display: 'flex', overflow: 'hidden' }}>
        {project.imageStorageUrl ? (
          <img
            src={project.imageStorageUrl}
            alt={project.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <PaletteThumbnail palette={project.palette} />
        )}
      </Card.Section>

      <Group justify="space-between" mt="xs" wrap="nowrap">
        <Stack gap={0} style={{ minWidth: 0 }}>
          <Text size="sm" fw={500} c="white" lineClamp={1}>{project.name}</Text>
          <Text size="xs" c="dimmed">{date}</Text>
        </Stack>

        <Menu withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" onClick={e => e.stopPropagation()}>
              <MoreHorizontal size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<FolderOpen size={14} />} onClick={e => { e.stopPropagation(); open(); }}>
              Open
            </Menu.Item>
            <Menu.Item
              leftSection={<Trash2 size={14} />}
              color="red"
              onClick={e => { e.stopPropagation(); onDelete(project.id); }}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}
