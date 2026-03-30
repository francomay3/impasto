import { SimpleGrid } from '@mantine/core';
import type { ProjectState } from '../../types';
import { ProjectCard } from './ProjectCard';
import { NewProjectCard } from './NewProjectCard';

interface Props {
  projects: ProjectState[];
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onCreate: () => void;
}

export function ProjectGrid({ projects, onDelete, onRename, onCreate }: Props) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
      <NewProjectCard onCreate={onCreate} />
      {projects.map(p => (
        <ProjectCard key={p.id} project={p} onDelete={onDelete} onRename={onRename} />
      ))}
    </SimpleGrid>
  );
}
