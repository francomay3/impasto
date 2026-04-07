import { useMemo } from 'react';
import type { useProjectState } from './useProjectState';
import type { useImageHandlers } from './useImageHandlers';
import type { InteractionAPI } from '../canvas/engine/toolStateManager';

type Project = ReturnType<typeof useProjectState>;
type ImageHandlers = ReturnType<typeof useImageHandlers>;

interface Options {
  project: Project;
  imageHandlers: ImageHandlers;
  interaction: InteractionAPI;
}

export function useFilterContextValue({ project, imageHandlers, interaction }: Options) {
  const { samplingLevels, startSamplingLevels, cancel } = interaction;

  return useMemo(
    () => ({
      filters: project.state.filters,
      preIndexingBlur: project.state.preIndexingBlur,
      setPreIndexingBlur: project.setPreIndexingBlur,
      samplingLevels,
      onAddFilter: project.addFilter,
      onDuplicateFilter: project.duplicateFilter,
      onRemoveFilter: project.removeFilter,
      onToggleFilter: project.toggleFilter,
      onUpdateFilter: project.updateFilter,
      onPreviewFilter: project.updateFilterPreview,
      onReorderFilters: project.reorderFilters,
      onStartSamplingLevels: startSamplingLevels,
      onSampleLevels: imageHandlers.handleSampleLevels,
      onCancelSamplingLevels: cancel,
    }),
    [
      project.state.filters,
      project.state.preIndexingBlur,
      project.setPreIndexingBlur,
      samplingLevels,
      project.addFilter,
      project.duplicateFilter,
      project.removeFilter,
      project.toggleFilter,
      project.updateFilter,
      project.updateFilterPreview,
      project.reorderFilters,
      startSamplingLevels,
      imageHandlers.handleSampleLevels,
      cancel,
    ]
  );
}
