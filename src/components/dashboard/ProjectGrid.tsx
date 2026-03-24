import { SimpleGrid } from '@mantine/core';
import type { ProjectState } from '../../types';
import { ProjectCard } from './ProjectCard';
import { EmptyState } from './EmptyState';

interface Props {
  projects: ProjectState[];
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function ProjectGrid({ projects, onDelete, onCreate }: Props) {
  if (projects.length === 0) return <EmptyState onCreate={onCreate} />;

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
      {projects.map(p => (
        <ProjectCard key={p.id} project={p} onDelete={onDelete} />
      ))}
    </SimpleGrid>
  );
}
