import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { ProjectState } from '../../types';
import { DEFAULT_PROJECT_STATE } from '../../types';
import {
  listFirestoreProjects,
  newProjectRef,
  createFirestoreProject,
  deleteFirestoreProject,
  renameFirestoreProject,
} from '../../services/FirestoreService';
import { useAuthStore } from '../auth/authStore';
import { queryKeys } from '../../lib/queryKeys';

const E2E_TEST_MODE = import.meta.env.VITE_E2E_TEST_MODE === 'true';

export function useProjects() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.projects(user?.uid ?? ''),
    queryFn: () => E2E_TEST_MODE
      ? Promise.resolve<ProjectState[]>((window as Window & { __e2e_projects?: ProjectState[] }).__e2e_projects ?? [])
      : listFirestoreProjects(user!.uid),
    enabled: !!user,
  });

  const orphan = data.find((p) => !p.imageStorageUrl) ?? null;
  const projects = data.filter((p) => !!p.imageStorageUrl);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const ref = E2E_TEST_MODE ? { id: `e2e-${Date.now()}` } : newProjectRef(user.uid);
      const blank: ProjectState = {
        ...DEFAULT_PROJECT_STATE,
        id: ref.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Seed per-project cache so ProjectPage renders immediately without fetching
      queryClient.setQueryData(queryKeys.project(user.uid, ref.id), blank);
      if (!E2E_TEST_MODE) {
        // Write in the background — navigation doesn't wait for it
        createFirestoreProject(user.uid, ref.id, blank).catch(() => {
          notifications.show({ message: 'Failed to save project', color: 'red' });
        });
      }
      return blank;
    },
    onSuccess: (created) => {
      queryClient.setQueryData<ProjectState[]>(
        queryKeys.projects(user!.uid),
        (prev = []) => [created, ...prev]
      );
    },
    onError: () => {
      notifications.show({ message: 'Failed to create project', color: 'red' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (projectId: string) => {
      if (E2E_TEST_MODE) return Promise.resolve();
      if (!user) throw new Error('Not authenticated');
      return deleteFirestoreProject(user.uid, projectId);
    },
    onMutate: (projectId) => {
      const key = queryKeys.projects(user!.uid);
      const previous = queryClient.getQueryData<ProjectState[]>(key);
      queryClient.setQueryData<ProjectState[]>(key, (prev = []) => prev.filter((p) => p.id !== projectId));
      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.projects(user!.uid), context.previous);
      }
      notifications.show({ message: 'Failed to delete project', color: 'red' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects(user!.uid) });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ projectId, name }: { projectId: string; name: string }) => {
      if (E2E_TEST_MODE) return Promise.resolve();
      if (!user) throw new Error('Not authenticated');
      return renameFirestoreProject(user.uid, projectId, name);
    },
    onSuccess: (_, { projectId, name }) => {
      queryClient.setQueryData<ProjectState[]>(
        queryKeys.projects(user!.uid),
        (prev = []) => prev.map((p) => (p.id === projectId ? { ...p, name } : p))
      );
    },
    onError: () => {
      notifications.show({ message: 'Failed to rename project', color: 'red' });
    },
  });

  return {
    projects,
    loading,
    hasAnyProject: data.length > 0,
    isCreating: createMutation.isPending,
    create: async () => {
      if (orphan) return orphan.id;
      const p = await createMutation.mutateAsync();
      return p.id;
    },
    remove: (projectId: string) => removeMutation.mutateAsync(projectId),
    rename: (projectId: string, name: string) => renameMutation.mutateAsync({ projectId, name }),
  };
}
