import type { ProjectState } from '../../types';

/**
 * Lists projects the user can open from the in-editor File menu: excludes the
 * current document, optional name search, newest {@link ProjectState#updatedAt} first.
 */
export function listProjectsForOpenModal(
  projects: ReadonlyArray<ProjectState>,
  currentProjectId: string | undefined,
  searchQuery: string
): ProjectState[] {
  const trimmed = searchQuery.trim();
  const withoutCurrent = currentProjectId
    ? projects.filter((p) => p.id !== currentProjectId)
    : projects.slice();

  const searchFiltered = trimmed
    ? withoutCurrent.filter((p) => p.name.toLowerCase().includes(trimmed.toLowerCase()))
    : withoutCurrent;

  return [...searchFiltered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
