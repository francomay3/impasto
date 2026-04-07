import { useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '../auth/authStore';
import {
  getFirestoreProject,
  saveFirestoreProject,
  saveFirestoreImageUrl,
  saveFirestoreThumbnailColors,
} from '../../services/FirestoreService';
import { uploadProjectImage, getProjectImageUrl } from '../../services/ImageStorageService';
import Editor from './Editor';
import { DEFAULT_PROJECT_STATE, createRawImage } from '../../types';
import type { ProjectState } from '../../types';
import { queryKeys } from '../../lib/queryKeys';

async function resolveProject(userId: string, projectId: string) {
  const project = await getFirestoreProject(userId, projectId);
  if (!project) return null;

  if (project.imageStorageUrl) {
    const url = await getProjectImageUrl(project.imageStorageUrl);
    const res = await fetch(url);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    bitmap.close();
    return { ...project, sourceImage: createRawImage(data, width, height) };
  }

  return project;
}

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const isTestMode = import.meta.env.VITE_E2E_TEST_MODE === 'true';

  const queryClient = useQueryClient();

  const { data: project, isLoading, isError } = useQuery({
    queryKey: queryKeys.project(user?.uid ?? '', id ?? ''),
    queryFn: () => resolveProject(user!.uid, id!),
    enabled: !isTestMode && !!user && !!id,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (isError || project === null) {
      notifications.show({ message: 'Project not found', color: 'red' });
      navigate('/', { replace: true });
    }
  }, [isError, project, navigate]);

  const onSave = useCallback(
    async (state: ProjectState) => {
      if (isTestMode || !user || !id) return;
      await saveFirestoreProject(user.uid, id, state);
    },
    [isTestMode, user, id]
  );

  const onNewImageFile = useCallback(
    async (file: File) => {
      if (isTestMode || !user || !id) return;
      const url = await uploadProjectImage(user.uid, id, file);
      await saveFirestoreImageUrl(user.uid, id, url);
      queryClient.setQueryData<ProjectState | null>(
        queryKeys.project(user.uid, id),
        (prev) => prev ? { ...prev, imageStorageUrl: url } : prev
      );
    },
    [isTestMode, user, id, queryClient]
  );

  const onThumbnailColors = useCallback(
    async (colors: string[]) => {
      if (isTestMode || !user || !id) return;
      await saveFirestoreThumbnailColors(user.uid, id, colors);
    },
    [isTestMode, user, id]
  );

  const isLoading_ = !isTestMode && isLoading;
  const initialState = isTestMode ? DEFAULT_PROJECT_STATE : (project ?? DEFAULT_PROJECT_STATE);

  return (
    <Editor
      key={isLoading_ ? 'loading' : 'loaded'}
      initialState={initialState}
      isLoading={isLoading_}
      onSave={onSave}
      onNewImageFile={onNewImageFile}
      onThumbnailColors={onThumbnailColors}
    />
  );
}
