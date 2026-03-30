import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { ProjectState, Color } from '../../types';

interface PaletteCore {
  stateRef: MutableRefObject<ProjectState>;
  saveAndSet: (next: ProjectState) => void;
  set: (next: ProjectState) => void;
}

export function useProjectPaletteActions({ stateRef, saveAndSet, set }: PaletteCore) {
  const setPalette = useCallback(
    (palette: Color[]) => {
      saveAndSet({ ...stateRef.current, palette, updatedAt: new Date().toISOString() });
    },
    [saveAndSet, stateRef]
  );

  const updateDerivedPalette = useCallback(
    (palette: Color[]) => {
      set({ ...stateRef.current, palette });
    },
    [set, stateRef]
  );

  const updateColor = useCallback(
    (id: string, changes: Partial<Color>) => {
      const palette = stateRef.current.palette.map((c) => (c.id === id ? { ...c, ...changes } : c));
      saveAndSet({ ...stateRef.current, palette, updatedAt: new Date().toISOString() });
    },
    [saveAndSet, stateRef]
  );

  const addSampledColor = useCallback(
    (id: string, sample: Color['sample'], hex: string) => {
      const newColor: Color = { id, hex, sample, locked: false, ratio: 0, mixRecipe: '' };
      saveAndSet({
        ...stateRef.current,
        palette: [...stateRef.current.palette, newColor],
        updatedAt: new Date().toISOString(),
      });
    },
    [saveAndSet, stateRef]
  );

  const removeColor = useCallback(
    (id: string) => {
      saveAndSet({
        ...stateRef.current,
        palette: stateRef.current.palette.filter((c) => c.id !== id),
        updatedAt: new Date().toISOString(),
      });
    },
    [saveAndSet, stateRef]
  );

  return { setPalette, updateDerivedPalette, updateColor, addSampledColor, removeColor };
}
