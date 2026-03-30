import { useState, useEffect, useCallback } from 'react';
import type { ProjectState } from '../types';
import { DEFAULT_PROJECT_STATE } from '../types';
import {
  listFirestoreProjects,
  createFirestoreProject,
  deleteFirestoreProject,
  renameFirestoreProject,
} from '../services/FirestoreService';
import { useAuth } from '../features/auth/AuthContext';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listFirestoreProjects(user.uid).then(p => {
      setProjects(p);
      setLoading(false);
    });
  }, [user]);

  const create = useCallback(async (): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const blank: ProjectState = {
      ...DEFAULT_PROJECT_STATE,
      id: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const id = await createFirestoreProject(user.uid, blank);
    setProjects(prev => [{ ...blank, id }, ...prev]);
    return id;
  }, [user]);

  const remove = useCallback(async (projectId: string) => {
    if (!user) return;
    await deleteFirestoreProject(user.uid, projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
  }, [user]);

  const rename = useCallback(async (projectId: string, name: string) => {
    if (!user) return;
    await renameFirestoreProject(user.uid, projectId, name);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name } : p));
  }, [user]);

  return { projects, loading, create, remove, rename };
}
