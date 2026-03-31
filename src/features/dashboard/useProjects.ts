import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { ProjectState } from '../../types';
import { DEFAULT_PROJECT_STATE } from '../../types';
import {
  listFirestoreProjects,
  createFirestoreProject,
  deleteFirestoreProject,
  renameFirestoreProject,
} from '../../services/FirestoreService';
import { useAuthStore } from '../auth/authStore';
import { queryKeys } from '../../lib/queryKeys';

export function useProjects() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.projects(user?.uid ?? ''),
    queryFn: () => listFirestoreProjects(user!.uid),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const blank: ProjectState = {
        ...DEFAULT_PROJECT_STATE,
        id: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const id = await createFirestoreProject(user.uid, blank);
      return { ...blank, id };
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
      if (!user) throw new Error('Not authenticated');
      return deleteFirestoreProject(user.uid, projectId);
    },
    onSuccess: (_, projectId) => {
      queryClient.setQueryData<ProjectState[]>(
        queryKeys.projects(user!.uid),
        (prev = []) => prev.filter((p) => p.id !== projectId)
      );
    },
    onError: () => {
      notifications.show({ message: 'Failed to delete project', color: 'red' });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ projectId, name }: { projectId: string; name: string }) => {
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
    isCreating: createMutation.isPending,
    create: () => createMutation.mutateAsync(),
    remove: (projectId: string) => removeMutation.mutateAsync(projectId),
    rename: (projectId: string, name: string) => renameMutation.mutateAsync({ projectId, name }),
  };
}
