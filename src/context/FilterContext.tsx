import { createContext, useContext } from 'react';
import type { FilterInstance, FilterType, ColorSample } from '../types';

export interface SamplingLevels {
  filterId: string;
  point: 'black' | 'white';
}

interface FilterContextValue {
  filters: FilterInstance[];
  preIndexingBlur: number;
  setPreIndexingBlur: (value: number) => void;
  samplingLevels: SamplingLevels | null;
  onAddFilter: (type: FilterType) => void;
  onDuplicateFilter: (id: string) => void;
  onRemoveFilter: (id: string) => void;
  onUpdateFilter: (id: string, params: Record<string, number>) => void;
  onPreviewFilter: (id: string, params: Record<string, number>) => void;
  onReorderFilters: (filters: FilterInstance[]) => void;
  onStartSamplingLevels: (filterId: string, point: 'black' | 'white') => void;
  onSampleLevels: (sample: ColorSample, hex: string) => void;
  onCancelSamplingLevels: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useFilterContext(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilterContext must be used within FilterContext.Provider');
  return ctx;
}

export { FilterContext };
