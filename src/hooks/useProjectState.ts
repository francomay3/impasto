import { useState, useCallback } from 'react';
import type { ProjectState, Color, ColorGroup, FilterSettings } from '../types';
import { DEFAULT_PROJECT_STATE, DEFAULT_FILTERS } from '../types';
import { storageService } from '../services/StorageService';

function createProject(): ProjectState {
  return {
    ...DEFAULT_PROJECT_STATE,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useProjectState() {
  const [state, setState] = useState<ProjectState>(() => {
    const saved = storageService.load();
    return saved ?? createProject();
  });

  const updateState = useCallback((partial: Partial<ProjectState>) => {
    setState(prev => {
      const next = { ...prev, ...partial, updatedAt: new Date().toISOString() };
      storageService.save(next);
      return next;
    });
  }, []);

  const setImage = useCallback((dataUrl: string) => {
    const initialColor: Color = { id: crypto.randomUUID(), hex: '#000000', locked: false, ratio: 0, mixRecipe: '' };
    updateState({ imageDataUrl: dataUrl, palette: [initialColor], groups: [], filters: DEFAULT_FILTERS });
  }, [updateState]);

  const setPalette = useCallback((palette: Color[]) => {
    updateState({ palette });
  }, [updateState]);

  const updateColor = useCallback((id: string, changes: Partial<Color>) => {
    setState(prev => {
      const palette = prev.palette.map(c => c.id === id ? { ...c, ...changes } : c);
      const next = { ...prev, palette, updatedAt: new Date().toISOString() };
      storageService.save(next);
      return next;
    });
  }, []);

  const setFilters = useCallback((filters: FilterSettings) => {
    updateState({ filters });
  }, [updateState]);

  const setPaletteSize = useCallback((paletteSize: number) => {
    updateState({ paletteSize });
  }, [updateState]);

  const addColor = useCallback((id: string) => {
    setState(prev => {
      const newColor: Color = { id, hex: '#000000', locked: false, ratio: 0, mixRecipe: '' };
      const palette = [...prev.palette, newColor];
      const next = { ...prev, palette, updatedAt: new Date().toISOString() };
      storageService.save(next);
      return next;
    });
  }, []);

  const removeColor = useCallback((id: string) => {
    setState(prev => {
      const palette = prev.palette.filter(c => c.id !== id);
      const next = { ...prev, palette, updatedAt: new Date().toISOString() };
      storageService.save(next);
      return next;
    });
  }, []);

  const addGroup = useCallback((id: string, name: string) => {
    setState(prev => {
      const groups = [...(prev.groups ?? []), { id, name }];
      const next = { ...prev, groups, updatedAt: new Date().toISOString() };
      storageService.save(next);
      return next;
    });
  }, []);

  const removeGroup = useCallback((id: string) => {
    setState(prev => {
      const groups = (prev.groups ?? []).filter(g => g.id !== id);
      const palette = prev.palette.map(c => c.groupId === id ? { ...c, groupId: undefined } : c);
      const next = { ...prev, groups, palette, updatedAt: new Date().toISOString() };
      storageService.save(next);
      return next;
    });
  }, []);

  const renameGroup = useCallback((id: string, name: string) => {
    setState(prev => {
      const groups = (prev.groups ?? []).map(g => g.id === id ? { ...g, name } : g);
      const next = { ...prev, groups, updatedAt: new Date().toISOString() };
      storageService.save(next);
      return next;
    });
  }, []);

  const setColorGroup = useCallback((colorId: string, groupId: string | undefined) => {
    setState(prev => {
      const palette = prev.palette.map(c => c.id === colorId ? { ...c, groupId } : c);
      const next = { ...prev, palette, updatedAt: new Date().toISOString() };
      storageService.save(next);
      return next;
    });
  }, []);

  const reorderGroups = useCallback((groups: ColorGroup[]) => {
    updateState({ groups });
  }, [updateState]);

  const newProject = useCallback(() => {
    const fresh = createProject();
    storageService.save(fresh);
    setState(fresh);
  }, []);

  return {
    state,
    setImage,
    setPalette,
    updateColor,
    setFilters,
    setPaletteSize,
    addColor,
    removeColor,
    addGroup,
    removeGroup,
    renameGroup,
    setColorGroup,
    reorderGroups,
    newProject,
  };
}
