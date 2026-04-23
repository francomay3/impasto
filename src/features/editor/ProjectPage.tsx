import { useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '../auth/authStore';
import { FREE_PROJECT_LIMIT } from '../dashboard/freeProjectLimit';
import { useProjects } from '../dashboard/useProjects';
import {
  getFirestoreProject,
  saveFirestoreProject,
  saveFirestoreThumbnailColors,
  setProjectOrphaned,
} from '../../services/FirestoreService';
import { uploadProjectImage, getProjectImageUrl } from '../../services/ImageStorageService';
import { projectSourceImageWebpStoragePath } from '../../storage/firestoreImpastoProjectDoc';
import Editor from './Editor';
import { DEFAULT_PROJECT_STATE, createRawImage } from '../../types';
import type { ProjectState, RawImage } from '../../types';
import { queryKeys } from '../../lib/queryKeys';

type ResolvedProject = { state: ProjectState; image: RawImage | null };

async function resolveProject(userId: string, projectId: string): Promise<ResolvedProject | null> {
  const project = await getFirestoreProject(userId, projectId);
  if (!project) return null;

  const downloadUrl = await getProjectImageUrl(
    projectSourceImageWebpStoragePath(userId, projectId)
  ).catch(() => null);
  if (downloadUrl) {
    const res = await fetch(downloadUrl);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    bitmap.close();
    return { state: project, image: createRawImage(data, width, height) };
  }

  return { state: project, image: null };
}

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { projects, createAlwaysNew } = useProjects();

  const queryClient = useQueryClient();

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.project(user?.uid ?? '', id ?? ''),
    queryFn: () => resolveProject(user!.uid, id!),
    enabled: !!user && !!id,
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
      if (!user || !id) return;
      await saveFirestoreProject(user.uid, id, state);
    },
    [user, id]
  );

  const onNewImageFile = useCallback(
    async (file: File) => {
      if (!user || !id) return;
      await uploadProjectImage(user.uid, id, file);
      await setProjectOrphaned(user.uid, id, false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.project(user.uid, id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects(user.uid) });
    },
    [user, id, queryClient]
  );

  const onThumbnailColors = useCallback(
    async (colors: string[]) => {
      if (!user || !id) return;
      await saveFirestoreThumbnailColors(user.uid, id, colors);
    },
    [user, id]
  );

  const onNewProjectFromReplaceImage = useCallback(async () => {
    if (projects.length >= FREE_PROJECT_LIMIT) {
      notifications.show({
        title: 'Project limit reached',
        message: 'Delete a project from the dashboard or upgrade your plan to add more.',
        color: 'yellow',
      });
      navigate('/');
      return;
    }
    const newId = await createAlwaysNew();
    navigate(`/projectv2/${newId}`);
  }, [projects.length, createAlwaysNew, navigate]);

  const isLoading_ = isLoading;
  const initialState = project?.state ?? DEFAULT_PROJECT_STATE;
  const initialImage = project?.image ?? null;

  return (
    <Editor
      key={isLoading_ ? 'loading' : 'loaded'}
      initialState={initialState}
      initialImage={initialImage}
      isLoading={isLoading_}
      onSave={onSave}
      onNewImageFile={onNewImageFile}
      onThumbnailColors={onThumbnailColors}
      onNewProjectFromReplaceImage={onNewProjectFromReplaceImage}
    />
  );
}
