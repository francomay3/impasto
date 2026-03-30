import type { useProjectState } from './useProjectState';
import type { useImageHandlers } from './useImageHandlers';
import type { SamplingLevels } from '../filters/FilterContext';

type Project = ReturnType<typeof useProjectState>;
type ImageHandlers = ReturnType<typeof useImageHandlers>;

interface Options {
  project: Project;
  imageHandlers: ImageHandlers;
  samplingLevels: SamplingLevels | null;
  setSamplingColorId: (id: string | null) => void;
  setSamplingLevels: (v: SamplingLevels | null) => void;
}

export function useFilterContextValue({
  project,
  imageHandlers,
  samplingLevels,
  setSamplingColorId,
  setSamplingLevels,
}: Options) {
  return {
    filters: project.state.filters,
    preIndexingBlur: project.state.preIndexingBlur,
    setPreIndexingBlur: project.setPreIndexingBlur,
    samplingLevels,
    onAddFilter: project.addFilter,
    onDuplicateFilter: project.duplicateFilter,
    onRemoveFilter: project.removeFilter,
    onUpdateFilter: project.updateFilter,
    onPreviewFilter: project.updateFilterPreview,
    onReorderFilters: project.reorderFilters,
    onStartSamplingLevels: (filterId: string, point: 'black' | 'white') => {
      setSamplingColorId(null);
      setSamplingLevels({ filterId, point });
    },
    onSampleLevels: imageHandlers.handleSampleLevels,
    onCancelSamplingLevels: () => setSamplingLevels(null),
  };
}
