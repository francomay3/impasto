import { useState, useCallback, useRef } from 'react';
import type { ProjectState, RawImage } from '../../types';
import { useProjectFilters } from './useProjectFilters';
import { useProjectGroups } from './useProjectGroups';
import { useProjectPaletteActions } from './useProjectPaletteActions';

interface ProjectStateOptions {
  initialState: ProjectState;
  onSave: (state: ProjectState) => void;
}

export function useProjectState({ initialState, onSave }: ProjectStateOptions) {
  const [state, setStateRaw] = useState<ProjectState>(initialState);
  const stateRef = useRef<ProjectState>(initialState);

  const set = useCallback((next: ProjectState) => {
    stateRef.current = next;
    setStateRaw(next);
  }, []);

  const saveAndSet = useCallback(
    (next: ProjectState) => {
      set(next);
      onSave(next);
    },
    [set, onSave]
  );

  const filters = useProjectFilters({ stateRef, saveAndSet, set });
  const paletteActions = useProjectPaletteActions({ stateRef, saveAndSet, set });
  const groups = useProjectGroups({ stateRef, saveAndSet });

  const setImage = useCallback(
    (image: RawImage) => {
      saveAndSet({
        ...stateRef.current,
        sourceImage: image,
        palette: [],
        groups: [],
        filters: [],
        preIndexingBlur: 3,
        updatedAt: new Date().toISOString(),
      });
    },
    [saveAndSet]
  );

  const setPaletteSize = useCallback(
    (paletteSize: number) => {
      saveAndSet({ ...stateRef.current, paletteSize, updatedAt: new Date().toISOString() });
    },
    [saveAndSet]
  );

  const renameName = useCallback(
    (name: string) => {
      saveAndSet({ ...stateRef.current, name, updatedAt: new Date().toISOString() });
    },
    [saveAndSet]
  );

  const restoreState = useCallback(
    (s: ProjectState) => {
      set({ ...s, updatedAt: new Date().toISOString() });
    },
    [set]
  );

  return {
    state,
    setImage,
    setPaletteSize,
    renameName,
    restoreState,
    ...filters,
    ...paletteActions,
    ...groups,
  };
}
