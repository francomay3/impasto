import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { ProjectState } from '../types';

interface Options {
  historyUndo: () => ProjectState | null;
  historyRedo: () => ProjectState | null;
  restoreState: (s: ProjectState) => void;
  save: (s: ProjectState) => void;
}

export function useUndoRedo({ historyUndo, historyRedo, restoreState, save }: Options) {
  const handleUndo = useCallback(() => {
    const prev = historyUndo();
    if (prev) { restoreState(prev); save(prev); }
    else { notifications.show({ message: 'Nothing left to undo', color: 'gray', autoClose: 1500 }); }
  }, [historyUndo, restoreState, save]);

  const handleRedo = useCallback(() => {
    const next = historyRedo();
    if (next) { restoreState(next); save(next); }
    else { notifications.show({ message: 'Nothing left to redo', color: 'gray', autoClose: 1500 }); }
  }, [historyRedo, restoreState, save]);

  return { handleUndo, handleRedo };
}
