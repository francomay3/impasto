import { notifications } from '@mantine/notifications';
import { useCallback, useRef, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImpastoEngine } from '../../engine/core/ImpastoEngineContext';
import type { ReplaceImageModalRef } from '../editor/ReplaceImageModal';
import { FREE_PROJECT_LIMIT } from '../dashboard/freeProjectLimit';
import { useProjects } from '../dashboard/useProjects';
import { getEmptyDocumentSnapshotForImageImport } from './importImageEmptySnapshot';
import { loadRawImageFromFile } from '../../utils/loadRawImageFromFile';

/**
 * Import / replace image for Project v2: opens the shared {@link ReplaceImageModal}, then applies a fresh
 * document snapshot + decoded raster via {@link ImpastoEngine.loadDocument} (no edits under `engine/`).
 */
export function useProjectV2ReplaceImage() {
  const engine = useImpastoEngine();
  const navigate = useNavigate();
  const { projects, createAlwaysNew } = useProjects();
  const replaceRef = useRef<ReplaceImageModalRef>(null);

  const hasDestructiveWork = useSyncExternalStore(
    useCallback(
      (onStoreChange) => {
        const u1 = engine.colorPins.subscribe(onStoreChange);
        const u2 = engine.filters.subscribe(onStoreChange);
        const u3 = engine.colorPinGroups.subscribe(onStoreChange);
        return () => {
          u1();
          u2();
          u3();
        };
      },
      [engine],
    ),
    useCallback(
      () =>
        engine.colorPins.getAll().length > 0 ||
        engine.filters.getFilters().length > 0 ||
        engine.colorPinGroups.getAll().length > 0,
      [engine],
    ),
    () => false,
  );

  const handleFileSelected = useCallback(
    async (file: File) => {
      try {
        const raw = await loadRawImageFromFile(file);
        engine.loadDocument(getEmptyDocumentSnapshotForImageImport(), raw, {
          documentChangeIntent: 'user-edit',
        });
        engine.selection.clear();
      } catch (err) {
        console.error('[project v2] import image failed:', err);
        notifications.show({
          title: 'Could not import image',
          message: err instanceof Error ? err.message : 'Unknown error',
          color: 'red',
        });
      }
    },
    [engine],
  );

  const openImportImage = useCallback(() => {
    replaceRef.current?.open();
  }, []);

  const handleNewProjectAfterReplace = useCallback(async () => {
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

  return {
    replaceRef,
    /** True when pins, filters, or groups exist — mirrors legacy “palette samples” gate for the replace warning. */
    hasDestructiveWork,
    handleFileSelected,
    openImportImage,
    handleNewProjectAfterReplace,
  };
}
