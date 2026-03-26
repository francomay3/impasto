import { useCallback, useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFirestoreProject, saveFirestoreProject, saveFirestoreImageUrl } from '../services/FirestoreService';
import { uploadProjectImage } from '../services/ImageStorageService';
import Editor from '../Editor';
import { DEFAULT_PROJECT_STATE, createRawImage } from '../types';
import type { ProjectState } from '../types';

type LoadState = ProjectState | 'loading' | 'not-found';

async function resolveInitialState(
  userId: string,
  projectId: string,
): Promise<ProjectState | 'not-found'> {
  const project = await getFirestoreProject(userId, projectId);
  if (!project) return 'not-found';

  if (project.imageStorageUrl) {
    const res = await fetch(project.imageStorageUrl);
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
  const { user } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    if (!user || !id) return;
    resolveInitialState(user.uid, id).then(setLoadState);
  }, [user, id]);

  const onSave = useCallback(async (state: ProjectState) => {
    if (!user || !id) return;
    await saveFirestoreProject(user.uid, id, state);
  }, [user, id]);

  const onNewImageFile = useCallback(async (file: File) => {
    if (!user || !id) return;
    const url = await uploadProjectImage(user.uid, id, file);
    await saveFirestoreImageUrl(user.uid, id, url);
  }, [user, id]);

  if (loadState === 'not-found') return <Navigate to="/" replace />;

  const isLoading = loadState === 'loading';
  return (
    <Editor
      key={isLoading ? 'loading' : 'loaded'}
      initialState={isLoading ? DEFAULT_PROJECT_STATE : loadState}
      isLoading={isLoading}
      onSave={onSave}
      onNewImageFile={onNewImageFile}
    />
  );
}
