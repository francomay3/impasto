import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { ProjectState, RawImage } from '../../types';

interface Options {
  historyUndo: () => { state: ProjectState; image: RawImage | null } | null;
  historyRedo: () => { state: ProjectState; image: RawImage | null } | null;
  restoreState: (s: ProjectState) => void;
  onImageRestore: (image: RawImage | null) => void;
  save: (s: ProjectState) => void;
}

export function useUndoRedo({ historyUndo, historyRedo, restoreState, onImageRestore, save }: Options) {
  const handleUndo = useCallback(() => {
    const prev = historyUndo();
    if (prev) {
      restoreState(prev.state);
      onImageRestore(prev.image);
      save(prev.state);
    } else {
      notifications.show({ message: 'Nothing left to undo', color: 'gray', autoClose: 1500 });
    }
  }, [historyUndo, restoreState, onImageRestore, save]);

  const handleRedo = useCallback(() => {
    const next = historyRedo();
    if (next) {
      restoreState(next.state);
      onImageRestore(next.image);
      save(next.state);
    } else {
      notifications.show({ message: 'Nothing left to redo', color: 'gray', autoClose: 1500 });
    }
  }, [historyRedo, restoreState, onImageRestore, save]);

  return { handleUndo, handleRedo };
}
