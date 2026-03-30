import { Box, Card, Text, ActionIcon, Group, Stack, Menu } from '@mantine/core';
import { MoreHorizontal, FolderOpen, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProjectState } from '../../types';
import useConfirmDialog from '../../shared/useConfirmDialog';
import { ProjectCardPreview } from './ProjectCardPreview';
import { RenameProjectModal } from './RenameProjectModal';
import { useContextMenu } from '../../context/ContextMenuContext';

interface Props {
  project: ProjectState;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

interface MenuItemsProps {
  onOpen: () => void;
  onOpenNewTab: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function CardMenuItems({ onOpen, onOpenNewTab, onRename, onDelete }: MenuItemsProps) {
  return (
    <>
      <Menu.Item leftSection={<FolderOpen size={14} />} onClick={onOpen}>Open</Menu.Item>
      <Menu.Item leftSection={<ExternalLink size={14} />} onClick={onOpenNewTab}>Open in new tab</Menu.Item>
      <Menu.Item leftSection={<Pencil size={14} />} onClick={onRename}>Rename</Menu.Item>
      <Menu.Divider />
      <Menu.Item leftSection={<Trash2 size={14} />} color="red" onClick={onDelete}>Delete</Menu.Item>
    </>
  );
}

export function ProjectCard({ project, onDelete, onRename }: Props) {
  const navigate = useNavigate();
  const { open: openMenu } = useContextMenu();
  const [hovered, setHovered] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const date = new Date(project.updatedAt).toLocaleDateString();
  const open = () => navigate(`/project/${project.id}`);
  const openInNewTab = () => window.open(`/project/${project.id}`, '_blank');

  const { confirm, confirmDialog } = useConfirmDialog({
    title: 'Delete project',
    description: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
    onConfirm: () => onDelete(project.id),
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: 'Open', icon: <FolderOpen size={14} />, onClick: open },
        { label: 'Open in new tab', icon: <ExternalLink size={14} />, onClick: openInNewTab },
        { label: 'Rename', icon: <Pencil size={14} />, onClick: () => setRenameOpen(true) },
        { type: 'divider' },
        { label: 'Delete', icon: <Trash2 size={14} />, onClick: confirm, color: 'red' },
      ],
    });
  };

  const menuHandlers = { onOpen: open, onOpenNewTab: openInNewTab, onRename: () => setRenameOpen(true), onDelete: confirm };

  return (
    <Card
      radius="md"
      padding="sm"
      style={{
        background: 'var(--mantine-color-dark-7)',
        border: `1px solid ${hovered ? 'var(--mantine-color-primary-6)' : 'var(--mantine-color-dark-5)'}`,
        cursor: 'pointer',
        transition: 'border-color 150ms ease',
      }}
      onClick={open}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card.Section style={{ height: 200, display: 'flex', overflow: 'hidden' }}>
        <ProjectCardPreview project={project} />
      </Card.Section>

      {project.palette.length > 0 && (
        <Card.Section style={{ display: 'flex', height: 8 }}>
          {project.palette.map((c) => (
            <Box key={c.id} style={{ flex: 1, background: c.hex }} />
          ))}
        </Card.Section>
      )}

      <Group justify="space-between" mt="xs" wrap="nowrap">
        <Stack gap={0} style={{ minWidth: 0 }}>
          <Text size="sm" fw={500} c="white" lineClamp={1}>{project.name}</Text>
          <Text size="xs" c="dimmed">{date}</Text>
        </Stack>
        <Menu withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <CardMenuItems {...menuHandlers} />
          </Menu.Dropdown>
        </Menu>
      </Group>

      {confirmDialog}
      <RenameProjectModal
        opened={renameOpen}
        name={project.name}
        onClose={() => setRenameOpen(false)}
        onConfirm={(name) => onRename(project.id, name)}
      />
    </Card>
  );
}
