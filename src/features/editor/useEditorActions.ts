import type { RefObject } from 'react';
import type { ProjectState } from '../../types';
import type { CanvasEngine } from '../canvas/engine/CanvasEngine';
import type { InteractionAPI } from '../canvas/engine/useToolState';
import type { ReplaceImageModalRef } from './ReplaceImageModal';
import type { useProjectState } from './useProjectState';
import type { useHistory } from './useHistory';
import { useImageHandlers } from './useImageHandlers';
import { useUndoRedo } from './useUndoRedo';
import { useEditorHandlers } from './useEditorHandlers';
import { useEditorHotkeys } from './useEditorHotkeys';
import { useEditorStore } from './editorStore';

type Project = ReturnType<typeof useProjectState>;
type History = ReturnType<typeof useHistory>;

interface Params {
  project: Project;
  interaction: InteractionAPI;
  engine: CanvasEngine;
  history: History;
  save: (s: ProjectState) => void;
  onThumbnailColors?: (colors: string[]) => void;
  onNewImageFile?: (file: File) => void;
  setActiveTab: (tab: string) => void;
  replaceRef: RefObject<ReplaceImageModalRef | null>;
}

export function useEditorActions({
  project, interaction, engine, history, save,
  onThumbnailColors, onNewImageFile, setActiveTab, replaceRef,
}: Params) {
  const imageHandlers = useImageHandlers({
    state: project.state,
    pipeline: engine.pipeline,
    setImage: project.setImage,
    updateColor: project.updateColor,
    setPalette: project.updateDerivedPalette,
    addSampledColor: project.addSampledColor,
    removeColor: project.removeColor,
    updateFilter: project.updateFilter,
    samplingColorId: interaction.samplingColorId,
    completeSample: interaction.completeSample,
    cancelSample: interaction.cancel,
    samplingLevels: interaction.samplingLevels,
    resetTransform: engine.resetTransform.bind(engine),
    saveThumbnailColors: onThumbnailColors,
  });

  const { handleUndo, handleRedo } = useUndoRedo({
    historyUndo: history.undo,
    historyRedo: history.redo,
    restoreState: project.restoreState,
    save,
  });

  const editorHandlers = useEditorHandlers({
    state: project.state,
    samplingColorId: interaction.samplingColorId,
    interaction,
    handleAddColorAtPosition: imageHandlers.handleAddColorAtPosition,
    handleSample: imageHandlers.handleSample,
    handleDeleteColor: imageHandlers.handleDeleteColor,
    handleImageLoadBitmap: imageHandlers.handleImageLoadBitmap,
    setActiveTab,
    replaceRef,
    onNewImageFile,
  });

  useEditorHotkeys({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onAddFilter: project.addFilter,
    onAddColor: editorHandlers.handleEnterAddColorMode,
    onClearSelection: () => useEditorStore.getState().setSelectedColorIds(new Set()),
    onDeleteSelectedColor: editorHandlers.handleDeleteSelectedColors,
    onPasteFile: editorHandlers.handlePasteFile,
    onToggleSelectTool: editorHandlers.handleToggleSelectTool,
    onToggleMarqueeTool: editorHandlers.handleToggleMarqueeTool,
    interaction,
  });

  return { imageHandlers, editorHandlers, handleUndo, handleRedo };
}
