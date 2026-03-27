import { useState, useCallback, useRef } from 'react';
import type { ProjectState, RawImage, Color, ColorGroup, FilterInstance, FilterType, FilterParams } from '../types';
import { DEFAULT_FILTER_PARAMS } from '../types';

interface ProjectStateOptions {
  initialState: ProjectState;
  onSave: (state: ProjectState) => void;
}

const ts = () => new Date().toISOString();

export function useProjectState({ initialState, onSave }: ProjectStateOptions) {
  const [state, setStateRaw] = useState<ProjectState>(initialState);
  const stateRef = useRef<ProjectState>(initialState);

  const set = useCallback((next: ProjectState) => {
    stateRef.current = next;
    setStateRaw(next);
  }, []);

  const saveAndSet = useCallback((next: ProjectState) => {
    set(next);
    onSave(next);
  }, [set, onSave]);

  const setImage = useCallback((image: RawImage) => {
    saveAndSet({ ...stateRef.current, sourceImage: image, palette: [], groups: [], filters: [], preIndexingBlur: 3, updatedAt: ts() });
  }, [saveAndSet]);

  const setPalette = useCallback((palette: Color[]) => {
    saveAndSet({ ...stateRef.current, palette, updatedAt: ts() });
  }, [saveAndSet]);

  // Updates sampled color hexes in state without persisting — hex is derived at runtime
  const updateDerivedPalette = useCallback((palette: Color[]) => {
    set({ ...stateRef.current, palette });
  }, [set]);

  const updateColor = useCallback((id: string, changes: Partial<Color>) => {
    const palette = stateRef.current.palette.map(c => c.id === id ? { ...c, ...changes } : c);
    saveAndSet({ ...stateRef.current, palette, updatedAt: ts() });
  }, [saveAndSet]);

  const addFilter = useCallback((type: FilterType, params?: FilterParams) => {
    const instance: FilterInstance = { id: crypto.randomUUID(), type, params: params ?? { ...DEFAULT_FILTER_PARAMS[type] } };
    saveAndSet({ ...stateRef.current, filters: [...stateRef.current.filters, instance], updatedAt: ts() });
  }, [saveAndSet]);

  const duplicateFilter = useCallback((id: string) => {
    const src = stateRef.current.filters.find(f => f.id === id);
    if (!src) return;
    const copy: FilterInstance = { id: crypto.randomUUID(), type: src.type, params: { ...src.params } };
    saveAndSet({ ...stateRef.current, filters: [...stateRef.current.filters, copy], updatedAt: ts() });
  }, [saveAndSet]);

  const removeFilter = useCallback((id: string) => {
    saveAndSet({ ...stateRef.current, filters: stateRef.current.filters.filter(f => f.id !== id), updatedAt: ts() });
  }, [saveAndSet]);

  const updateFilter = useCallback((id: string, params: Record<string, number>) => {
    const filters = stateRef.current.filters.map(f => f.id === id ? { ...f, params: { ...f.params, ...params } } : f);
    saveAndSet({ ...stateRef.current, filters, updatedAt: ts() });
  }, [saveAndSet]);

  const updateFilterPreview = useCallback((id: string, params: Record<string, number>) => {
    const filters = stateRef.current.filters.map(f => f.id === id ? { ...f, params: { ...f.params, ...params } } : f);
    set({ ...stateRef.current, filters });
  }, [set]);

  const reorderFilters = useCallback((filters: FilterInstance[]) => {
    saveAndSet({ ...stateRef.current, filters, updatedAt: ts() });
  }, [saveAndSet]);

  const setPreIndexingBlur = useCallback((preIndexingBlur: number) => {
    saveAndSet({ ...stateRef.current, preIndexingBlur, updatedAt: ts() });
  }, [saveAndSet]);

  const setPaletteSize = useCallback((paletteSize: number) => {
    saveAndSet({ ...stateRef.current, paletteSize, updatedAt: ts() });
  }, [saveAndSet]);

  const addSampledColor = useCallback((id: string, sample: Color['sample'], hex: string) => {
    const newColor: Color = { id, hex, sample, locked: false, ratio: 0, mixRecipe: '' };
    saveAndSet({ ...stateRef.current, palette: [...stateRef.current.palette, newColor], updatedAt: ts() });
  }, [saveAndSet]);

  const removeColor = useCallback((id: string) => {
    saveAndSet({ ...stateRef.current, palette: stateRef.current.palette.filter(c => c.id !== id), updatedAt: ts() });
  }, [saveAndSet]);

  const addGroup = useCallback((id: string, name: string) => {
    const groups = [...(stateRef.current.groups ?? []), { id, name }];
    saveAndSet({ ...stateRef.current, groups, updatedAt: ts() });
  }, [saveAndSet]);

  const removeGroup = useCallback((id: string) => {
    const groups = (stateRef.current.groups ?? []).filter(g => g.id !== id);
    const palette = stateRef.current.palette.map(c => c.groupId === id ? { ...c, groupId: undefined } : c);
    saveAndSet({ ...stateRef.current, groups, palette, updatedAt: ts() });
  }, [saveAndSet]);

  const renameGroup = useCallback((id: string, name: string) => {
    const groups = (stateRef.current.groups ?? []).map(g => g.id === id ? { ...g, name } : g);
    saveAndSet({ ...stateRef.current, groups, updatedAt: ts() });
  }, [saveAndSet]);

  const setColorGroup = useCallback((colorId: string, groupId: string | undefined) => {
    const palette = stateRef.current.palette.map(c => c.id === colorId ? { ...c, groupId } : c);
    saveAndSet({ ...stateRef.current, palette, updatedAt: ts() });
  }, [saveAndSet]);

  const reorderGroups = useCallback((groups: ColorGroup[]) => {
    saveAndSet({ ...stateRef.current, groups, updatedAt: ts() });
  }, [saveAndSet]);

  const renameName = useCallback((name: string) => {
    saveAndSet({ ...stateRef.current, name, updatedAt: ts() });
  }, [saveAndSet]);

  const restoreState = useCallback((s: ProjectState) => {
    set({ ...s, updatedAt: ts() });
  }, [set]);

  return {
    state, setImage, setPalette, updateDerivedPalette, updateColor,
    addFilter, duplicateFilter, removeFilter, updateFilter, updateFilterPreview, reorderFilters, setPreIndexingBlur,
    setPaletteSize, addSampledColor, removeColor,
    addGroup, removeGroup, renameGroup, setColorGroup, reorderGroups, renameName,
    restoreState,
  };
}
