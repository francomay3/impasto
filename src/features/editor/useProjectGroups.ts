import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { ProjectState, ColorGroup } from '../../types';

interface GroupCore {
  stateRef: MutableRefObject<ProjectState>;
  saveAndSet: (next: ProjectState) => void;
}

export function useProjectGroups({ stateRef, saveAndSet }: GroupCore) {
  const addGroup = useCallback(
    (id: string, name: string) => {
      const groups = [...(stateRef.current.groups ?? []), { id, name }];
      saveAndSet({ ...stateRef.current, groups, updatedAt: new Date().toISOString() });
    },
    [saveAndSet, stateRef]
  );

  const removeGroup = useCallback(
    (id: string) => {
      const groups = (stateRef.current.groups ?? []).filter((g) => g.id !== id);
      const palette = stateRef.current.palette.map((c) =>
        c.groupId === id ? { ...c, groupId: undefined } : c
      );
      saveAndSet({ ...stateRef.current, groups, palette, updatedAt: new Date().toISOString() });
    },
    [saveAndSet, stateRef]
  );

  const renameGroup = useCallback(
    (id: string, name: string) => {
      const groups = (stateRef.current.groups ?? []).map((g) =>
        g.id === id ? { ...g, name } : g
      );
      saveAndSet({ ...stateRef.current, groups, updatedAt: new Date().toISOString() });
    },
    [saveAndSet, stateRef]
  );

  const setColorGroup = useCallback(
    (colorId: string, groupId: string | undefined) => {
      const palette = stateRef.current.palette.map((c) =>
        c.id === colorId ? { ...c, groupId } : c
      );
      saveAndSet({ ...stateRef.current, palette, updatedAt: new Date().toISOString() });
    },
    [saveAndSet, stateRef]
  );

  const reorderGroups = useCallback(
    (groups: ColorGroup[]) => {
      saveAndSet({ ...stateRef.current, groups, updatedAt: new Date().toISOString() });
    },
    [saveAndSet, stateRef]
  );

  return { addGroup, removeGroup, renameGroup, setColorGroup, reorderGroups };
}
