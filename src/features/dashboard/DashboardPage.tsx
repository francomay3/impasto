import { Box, Container, Loader, Center } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useProjects } from './useProjects';
import { DashboardHeader } from './DashboardHeader';
import { ProjectGrid } from './ProjectGrid';
import { UpgradeModal } from './UpgradeModal';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { FREE_PROJECT_LIMIT } from './freeProjectLimit';

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    projects,
    orphanId,
    loading,
    hasAnyProject,
    isCreating,
    create,
    remove,
    rename,
  } = useProjects();
  const [search, setSearch] = useState('');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Empty Firestore → seed first project (handled in useProjects / Firestore).
    if (!hasAnyProject) {
      create().then((id) => navigate(`/projectv2/${id}`, { replace: true }));
      return;
    }

    // `projects` hides rows without `imageStorageUrl`; `hasAnyProject` does not — send the user
    // to the orphan so they are not stuck on an empty grid.
    if (projects.length === 0 && orphanId != null) {
      navigate(`/projectv2/${orphanId}`, { replace: true });
    }
  }, [loading, hasAnyProject, projects.length, orphanId, create, navigate]);

  const handleCreate = async () => {
    if (projects.length >= FREE_PROJECT_LIMIT) {
      setUpgradeOpen(true);
      return;
    }
    const id = await create();
    navigate(`/projectv2/${id}`);
  };

  const filtered = search
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <Box style={{ minHeight: '100vh', background: 'var(--mantine-color-dark-9)' }}>
      <DashboardHeader search={search} onSearch={setSearch} />

      <Container size="xl" py="xl">
        {loading || isCreating ? (
          <Center h="50vh">
            <Loader color="primary" />
          </Center>
        ) : (
          <ErrorBoundary label="Project grid" compact>
            <ProjectGrid
              projects={filtered}
              onDelete={remove}
              onRename={rename}
              onCreate={handleCreate}
            />
          </ErrorBoundary>
        )}
      </Container>

      <UpgradeModal opened={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </Box>
  );
}
