import { useEffect, useState } from 'react';
import { Center, Loader, Modal, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { useProjects } from '../dashboard/useProjects';
import { ProjectCard } from '../dashboard/ProjectCard';
import { listProjectsForOpenModal } from './openProjectModalLogic';

interface OpenProjectModalProps {
  opened: boolean;
  onClose: () => void;
}

export function OpenProjectModal({ opened, onClose }: OpenProjectModalProps) {
  const { id: currentProjectId } = useParams<{ id: string }>();
  const { projects, loading, remove, rename } = useProjects();
  const [search, setSearch] = useState('');

  // Fresh search each time the modal reopens.
  useEffect(() => {
    if (opened) setSearch('');
  }, [opened]);

  // ProjectCard navigates on click — close the modal when the route changes.
  useEffect(() => {
    if (opened) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId]);

  const rows = listProjectsForOpenModal(projects, currentProjectId, search);

  return (
    <Modal opened={opened} onClose={onClose} title="Open project" size="xl">
      <Stack gap="sm">
        <TextInput
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        {loading ? (
          <Center p="md">
            <Loader color="primary" />
          </Center>
        ) : rows.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="md">
            No other projects to open
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
            {rows.map((p) => (
              <ProjectCard key={p.id} project={p} onDelete={remove} onRename={rename} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Modal>
  );
}
