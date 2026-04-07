import { useState, useLayoutEffect, useCallback, useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { ProjectState, RawImage } from '../../types';
import type { CanvasEngine } from '../canvas/engine/CanvasEngine';
import type { InteractionAPI } from '../canvas/engine/toolStateManager';
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
  initialImage?: RawImage | null;
  sourceImageRef: MutableRefObject<RawImage | null>;
  onThumbnailColors?: (colors: string[]) => void;
  onNewImageFile?: (file: File) => void;
  setActiveTab: (tab: string) => void;
  onResetFilterTool: () => void;
  replaceRef: MutableRefObject<ReplaceImageModalRef | null>;
}

export function useEditorActions({
  project, interaction, engine, history, save,
  initialImage, sourceImageRef,
  onThumbnailColors, onNewImageFile, setActiveTab, onResetFilterTool, replaceRef,
}: Params) {
  const [sourceImage, setSourceImage] = useState<RawImage | null>(initialImage ?? null);
  useLayoutEffect(() => { sourceImageRef.current = sourceImage; });

  const onImageLoaded = useCallback((image: RawImage) => {
    engine.setSourceImage(image);
    setSourceImage(image);
  }, [engine]);

  const imageHandlers = useImageHandlers({
    state: project.state,
    sourceImage,
    pipeline: engine.pipeline,
    setImage: project.setImage,
    onImageLoaded,
    updateColor: project.updateColor,
    setPalette: project.updateDerivedPalette,
    addSampledColor: project.addSampledColor,
    removeColor: project.removeColor,
    updateFilter: project.updateFilter,
    completeSample: interaction.completeSample,
    cancelSample: interaction.cancel,
    samplingLevels: interaction.samplingLevels,
    resetTransform: engine.resetTransform.bind(engine),
    saveThumbnailColors: onThumbnailColors,
  });

  // Load initial image into the canvas pipeline once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (initialImage) imageHandlers.handleImageRestore(initialImage); }, []);

  const onImageRestore = useCallback((image: RawImage | null) => {
    engine.setSourceImage(image);
    setSourceImage(image);
    imageHandlers.handleImageRestore(image);
  }, [engine, imageHandlers]);

  const { handleUndo, handleRedo } = useUndoRedo({
    historyUndo: history.undo,
    historyRedo: history.redo,
    restoreState: project.restoreState,
    onImageRestore,
    save,
  });

  const editorHandlers = useEditorHandlers({
    state: project.state,
    interaction,
    handleAddColorAtPosition: imageHandlers.handleAddColorAtPosition,
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
    onResetFilterTool,
    interaction,
  });

  return { imageHandlers, editorHandlers, handleUndo, handleRedo, sourceImage };
}
