import { useCallback, useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import { getFirestoreProject, saveFirestoreProject, saveFirestoreImageUrl } from '../services/FirestoreService';
import { uploadProjectImage } from '../services/ImageStorageService';
import Editor from '../Editor';
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
    const dataUrl = await new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    return { ...project, imageDataUrl: dataUrl };
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

  if (loadState === 'loading') {
    return (
      <Center h="100vh" style={{ background: 'var(--mantine-color-dark-9)' }}>
        <Loader color="teal" />
      </Center>
    );
  }

  if (loadState === 'not-found') return <Navigate to="/" replace />;

  return <Editor initialState={loadState} onSave={onSave} onNewImageFile={onNewImageFile} />;
}
