import { Box, Container, Loader, Center } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useProjects } from './useProjects';
import { DashboardHeader } from './DashboardHeader';
import { ProjectGrid } from './ProjectGrid';
import { UpgradeModal } from './UpgradeModal';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const FREE_PROJECT_LIMIT = 10;

export function DashboardPage() {
  const navigate = useNavigate();
  const { projects, loading, create, remove, rename } = useProjects();
  const [search, setSearch] = useState('');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && projects.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCreating(true);
      create().then(id => navigate(`/project/${id}`, { replace: true }));
    }
  }, [loading, projects.length, create, navigate]);

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
        {loading || creating ? (
          <Center h="50vh">
            <Loader color="primary" />
          </Center>
        ) : (
          <ErrorBoundary label="Project grid" compact>
            <ProjectGrid projects={filtered} onDelete={remove} onRename={rename} onCreate={handleCreate} />
          </ErrorBoundary>
        )}
      </Container>

      <UpgradeModal opened={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </Box>
  );
}
