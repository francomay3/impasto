import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { ProjectState, FilterInstance, FilterType, FilterParams } from '../../types';
import { DEFAULT_FILTER_PARAMS } from '../../types';

interface FilterCore {
  stateRef: MutableRefObject<ProjectState>;
  saveAndSet: (next: ProjectState) => void;
  set: (next: ProjectState) => void;
}

export function useProjectFilters({ stateRef, saveAndSet, set }: FilterCore) {
  const addFilter = useCallback(
    (type: FilterType, params?: FilterParams) => {
      const instance: FilterInstance = {
        id: crypto.randomUUID(),
        type,
        params: params ?? { ...DEFAULT_FILTER_PARAMS[type] },
      };
      saveAndSet({
        ...stateRef.current,
        filters: [...stateRef.current.filters, instance],
        updatedAt: new Date().toISOString(),
      });
    },
    [saveAndSet, stateRef]
  );

  const duplicateFilter = useCallback(
    (id: string) => {
      const src = stateRef.current.filters.find((f) => f.id === id);
      if (!src) return;
      saveAndSet({
        ...stateRef.current,
        filters: [
          ...stateRef.current.filters,
          { id: crypto.randomUUID(), type: src.type, params: { ...src.params } },
        ],
        updatedAt: new Date().toISOString(),
      });
    },
    [saveAndSet, stateRef]
  );

  const removeFilter = useCallback(
    (id: string) => {
      saveAndSet({
        ...stateRef.current,
        filters: stateRef.current.filters.filter((f) => f.id !== id),
        updatedAt: new Date().toISOString(),
      });
    },
    [saveAndSet, stateRef]
  );

  const updateFilter = useCallback(
    (id: string, params: Record<string, number>) => {
      const filters = stateRef.current.filters.map((f) =>
        f.id === id ? { ...f, params: { ...f.params, ...params } } : f
      );
      saveAndSet({ ...stateRef.current, filters, updatedAt: new Date().toISOString() });
    },
    [saveAndSet, stateRef]
  );

  const updateFilterPreview = useCallback(
    (id: string, params: Record<string, number>) => {
      const filters = stateRef.current.filters.map((f) =>
        f.id === id ? { ...f, params: { ...f.params, ...params } } : f
      );
      set({ ...stateRef.current, filters });
    },
    [set, stateRef]
  );

  const reorderFilters = useCallback(
    (filters: FilterInstance[]) => {
      saveAndSet({ ...stateRef.current, filters, updatedAt: new Date().toISOString() });
    },
    [saveAndSet, stateRef]
  );

  const setPreIndexingBlur = useCallback(
    (preIndexingBlur: number) => {
      saveAndSet({ ...stateRef.current, preIndexingBlur, updatedAt: new Date().toISOString() });
    },
    [saveAndSet, stateRef]
  );

  return {
    addFilter,
    duplicateFilter,
    removeFilter,
    updateFilter,
    updateFilterPreview,
    reorderFilters,
    setPreIndexingBlur,
  };
}
