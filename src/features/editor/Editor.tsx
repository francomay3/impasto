import { useCallback, useRef, useState } from 'react';
import { AppShell, Center, Loader } from '@mantine/core';

import { useProjectState } from './useProjectState';
import { useHistory } from './useHistory';
import { useSaveStatus } from './useSaveStatus';
import { useCanvasPipeline } from '../canvas/useCanvasPipeline';
import { useViewportTransform } from '../canvas/useViewportTransform';
import { useImageHandlers } from './useImageHandlers';
import { useUndoRedo } from './useUndoRedo';
import { useEditorHotkeys } from './useEditorHotkeys';
import { useEditorHandlers } from './useEditorHandlers';
import { useInteraction } from '../canvas/useInteraction';
import { ReplaceImageModal, type ReplaceImageModalRef } from './ReplaceImageModal';
import { AppHeader } from './AppHeader';
import { ExportModal } from './ExportModal';
import { EditorTabs } from './EditorTabs';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { PaletteContext } from '../palette/PaletteContext';
import { FilterContext } from '../filters/FilterContext';
import { EditorContext } from './EditorContext';
import { CanvasContext } from '../canvas/CanvasContext';
import { SelectionPopoverPortal } from '../palette/SelectionPopoverPortal';
import { usePaletteContextValue } from './usePaletteContextValue';
import { useFilterContextValue } from './useFilterContextValue';
import { useCanvasContextValue } from './useCanvasContextValue';
import { useEditorContextValue } from './useEditorContextValue';
import { useEditorStore } from './editorStore';
import type { ProjectState } from '../../types';

interface AppProps {
  initialState: ProjectState;
  isLoading?: boolean;
  onSave: (state: ProjectState) => void | Promise<void>;
  onNewImageFile?: (file: File) => void;
  onThumbnailColors?: (colors: string[]) => void;
}

export default function Editor({ initialState, isLoading, onSave, onNewImageFile, onThumbnailColors }: AppProps) {
  const history = useHistory(initialState);
  const { status: saveStatus, save } = useSaveStatus(onSave);
  const onStateChange = useCallback(
    (s: ProjectState) => { history.push(s); save(s); },
    [history, save]
  );
  const project = useProjectState({ initialState, onSave: onStateChange });
  const filteredCanvasRef = useRef<HTMLCanvasElement>(null);
  const indexedCanvasRef = useRef<HTMLCanvasElement>(null);
  const pipeline = useCanvasPipeline(filteredCanvasRef);
  const viewport = useViewportTransform();
  const replaceRef = useRef<ReplaceImageModalRef>(null);
  const interaction = useInteraction();
  const [activeTab, setActiveTab] = useState('filters');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const selectColor = useEditorStore(s => s.selectColor);

  const imageHandlers = useImageHandlers({
    state: project.state, pipeline,
    setImage: project.setImage, updateColor: project.updateColor,
    setPalette: project.updateDerivedPalette, addSampledColor: project.addSampledColor,
    removeColor: project.removeColor, updateFilter: project.updateFilter,
    samplingColorId: interaction.samplingColorId,
    completeSample: interaction.completeSample,
    cancelSample: interaction.cancel,
    samplingLevels: interaction.samplingLevels,
    resetTransform: viewport.resetTransform,
    saveThumbnailColors: onThumbnailColors,
  });

  const { handleUndo, handleRedo } = useUndoRedo({
    historyUndo: history.undo, historyRedo: history.redo,
    restoreState: project.restoreState, save,
  });

  const editorHandlers = useEditorHandlers({
    state: project.state,
    samplingColorId: interaction.samplingColorId,
    interaction,
    handleAddColorAtPosition: imageHandlers.handleAddColorAtPosition,
    handleSample: imageHandlers.handleSample,
    handleDeleteColor: imageHandlers.handleDeleteColor,
    handleImageLoadBitmap: imageHandlers.handleImageLoadBitmap,
    setActiveTab, replaceRef, onNewImageFile,
  });

  useEditorHotkeys({
    onUndo: handleUndo, onRedo: handleRedo,
    onAddFilter: project.addFilter, onAddColor: editorHandlers.handleEnterAddColorMode,
    onClearSelection: () => useEditorStore.getState().setSelectedColorIds(new Set()),
    onDeleteSelectedColor: editorHandlers.handleDeleteSelectedColors,
    onPasteFile: editorHandlers.handlePasteFile,
    onToggleSelectTool: editorHandlers.handleToggleSelectTool,
    onToggleMarqueeTool: editorHandlers.handleToggleMarqueeTool,
    interaction,
  });

  const paletteValue = usePaletteContextValue({ project, imageHandlers, editorHandlers, interaction });
  const filterValue = useFilterContextValue({ project, imageHandlers, interaction });
  const canvasValue = useCanvasContextValue({
    project, viewport, filteredCanvasRef, indexedCanvasRef, interaction, showLabels, setShowLabels,
  });
  const editorValue = useEditorContextValue({
    project, editorHandlers, saveStatus,
    canUndo: history.canUndo, canRedo: history.canRedo, isLoading: !!isLoading,
    activeTab, setActiveTab,
    setExportModalOpen, replaceRef, handleUndo, handleRedo,
  });

  return (
    <CanvasContext.Provider value={canvasValue}>
      <EditorContext.Provider value={editorValue}>
        <PaletteContext.Provider value={paletteValue}>
          <FilterContext.Provider value={filterValue}>
            <SelectionPopoverPortal />
            <AppShell header={{ height: 68 }} padding={0}>
              <ErrorBoundary label="Header" compact>
                <AppHeader />
              </ErrorBoundary>
              <AppShell.Main
                onClick={() => selectColor(null)}
                style={{
                  background: 'var(--mantine-color-dark-9)',
                  paddingTop: 'calc(var(--app-shell-header-height) + 4px)',
                  userSelect: 'none',
                }}
              >
                {isLoading ? (
                  <Center h="calc(100vh - var(--app-shell-header-height))">
                    <Loader color="primary" />
                  </Center>
                ) : (
                  <EditorTabs height="calc(100vh - var(--app-shell-header-height))" />
                )}
              </AppShell.Main>
              <ExportModal
                opened={exportModalOpen}
                state={project.state}
                onClose={() => setExportModalOpen(false)}
              />
              <ReplaceImageModal
                ref={replaceRef}
                hasSamples={project.state.palette.some((c) => c.sample)}
                onFileSelected={editorHandlers.handleFileSelected}
              />
            </AppShell>
          </FilterContext.Provider>
        </PaletteContext.Provider>
      </EditorContext.Provider>
    </CanvasContext.Provider>
  );
}
