import { Box, Container, Button, Group, Loader, Center } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { ProjectGrid } from '../components/dashboard/ProjectGrid';
import { UpgradeModal } from '../components/dashboard/UpgradeModal';

const FREE_PROJECT_LIMIT = 1;

export function DashboardPage() {
  const navigate = useNavigate();
  const { projects, loading, create, remove } = useProjects();
  const [search, setSearch] = useState('');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleCreate = async () => {
    if (projects.length >= FREE_PROJECT_LIMIT) {
      setUpgradeOpen(true);
      return;
    }
    const id = await create();
    navigate(`/project/${id}`);
  };

  const filtered = search
    ? projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <Box style={{ minHeight: '100vh', background: 'var(--mantine-color-dark-9)' }}>
      <DashboardHeader search={search} onSearch={setSearch} />

      <Container size="xl" py="xl">
        {projects.length > 0 && (
          <Group justify="flex-end" mb="xl">
            <Button onClick={handleCreate} leftSection={<Plus size={16} />} color="primary">
              New project
            </Button>
          </Group>
        )}

        {loading ? (
          <Center h="50vh">
            <Loader color="primary" />
          </Center>
        ) : (
          <ProjectGrid projects={filtered} onDelete={remove} onCreate={handleCreate} />
        )}
      </Container>

      <UpgradeModal opened={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </Box>
  );
}
