import { useCallback, useRef, useState } from 'react';
import { AppShell, Center, Loader } from '@mantine/core';

import { useProjectState } from './hooks/useProjectState';
import { useHistory } from './hooks/useHistory';
import { useSaveStatus } from './hooks/useSaveStatus';
import { useCanvasPipeline } from './hooks/useCanvasPipeline';
import { useViewportTransform } from './hooks/useViewportTransform';
import { useImageHandlers } from './hooks/useImageHandlers';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useEditorHotkeys } from './hooks/useEditorHotkeys';
import { ReplaceImageModal, type ReplaceImageModalRef } from './components/ReplaceImageModal';
import { AppHeader } from './components/AppHeader';
import { ExportModal } from './components/ExportModal';
import { EditorTabs } from './components/EditorTabs';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PaletteContext } from './context/PaletteContext';
import { FilterContext } from './context/FilterContext';
import { EditorContext } from './context/EditorContext';
import { CanvasContext } from './context/CanvasContext';
import type { SamplingLevels } from './context/FilterContext';
import type { ProjectState } from './types';

interface AppProps {
  initialState: ProjectState;
  isLoading?: boolean;
  onSave: (state: ProjectState) => void | Promise<void>;
  onNewImageFile?: (file: File) => void;
}

export default function Editor({ initialState, isLoading, onSave, onNewImageFile }: AppProps) {
  const { push: historyPush, undo: historyUndo, redo: historyRedo, canUndo, canRedo } = useHistory(initialState);
  const { status: saveStatus, save } = useSaveStatus(onSave);
  const handleStateChange = useCallback((s: ProjectState) => { historyPush(s); save(s); }, [historyPush, save]);
  const project = useProjectState({ initialState, onSave: handleStateChange });
  const { state, restoreState, addFilter, duplicateFilter, removeFilter, updateFilter, updateFilterPreview, reorderFilters, setPreIndexingBlur,
    addSampledColor, removeColor, addGroup, removeGroup, renameGroup, setColorGroup, reorderGroups,
    setPalette, updateDerivedPalette, setImage, updateColor, renameName } = project;
  const filteredCanvasRef = useRef<HTMLCanvasElement>(null);
  const indexedCanvasRef = useRef<HTMLCanvasElement>(null);
  const pipeline = useCanvasPipeline(filteredCanvasRef, indexedCanvasRef);
  const viewport = useViewportTransform();
  const [samplingColorId, setSamplingColorId] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [samplingLevels, setSamplingLevels] = useState<SamplingLevels>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const replaceRef = useRef<ReplaceImageModalRef>(null);

  const { handleImageLoadBitmap, handleAddColor, handleAddColorAtPosition, handleDeleteColor,
    handleToggleHighlight, handleSample, handleCancelSample, handleSampleLevels } = useImageHandlers({
    state, pipeline, setImage, updateColor, setPalette: updateDerivedPalette, addSampledColor, removeColor, updateFilter,
    samplingColorId, setSamplingColorId, samplingLevels, setSamplingLevels,
    resetTransform: viewport.resetTransform,
  });

  const { handleUndo, handleRedo } = useUndoRedo({ historyUndo, historyRedo, restoreState, save });

  const handleFileSelected = useCallback((file: File) => {
    createImageBitmap(file).then(bitmap => handleImageLoadBitmap(bitmap));
    if (onNewImageFile) onNewImageFile(file);
  }, [handleImageLoadBitmap, onNewImageFile]);

  useEditorHotkeys({ onUndo: handleUndo, onRedo: handleRedo, onAddFilter: addFilter, onAddColor: handleAddColor, onClearSelection: () => setSelectedColorId(null) });

  const paletteValue = {
    palette: state.palette, groups: state.groups ?? [], samplingColorId,
    onStartSampling: (id) => { setSamplingLevels(null); setSamplingColorId(id); },
    onRenameColor: (id, name) => updateColor(id, { name }),
    onAddColor: handleAddColor, onAddColorAtPosition: handleAddColorAtPosition, onDeleteColor: handleDeleteColor, onToggleHighlight: handleToggleHighlight,
    onMoveSamplePin: (id, sample) => updateColor(id, { sample }),
    onRemoveSamplePin: (id) => updateColor(id, { sample: undefined }),
    onAddGroup: addGroup, onRemoveGroup: removeGroup, onRenameGroup: renameGroup,
    onSetColorGroup: setColorGroup, onReorderPalette: setPalette, onReorderGroups: reorderGroups,
  };

  const filterValue = {
    filters: state.filters, preIndexingBlur: state.preIndexingBlur, samplingLevels,
    onAddFilter: addFilter, onDuplicateFilter: duplicateFilter, onRemoveFilter: removeFilter,
    onUpdateFilter: updateFilter, onPreviewFilter: updateFilterPreview, onReorderFilters: reorderFilters,
    onStartSamplingLevels: (filterId, point) => { setSamplingColorId(null); setSamplingLevels({ filterId, point }); },
    onSampleLevels: handleSampleLevels,
    onCancelSamplingLevels: () => setSamplingLevels(null),
  };

  const canvasValue = {
    sourceImage: state.sourceImage,
    filteredCanvasRef, indexedCanvasRef,
    viewportTransform: viewport.transform,
    isDragging: viewport.isDragging,
    isSampling: !!samplingColorId || !!samplingLevels,
    showLabels, onToggleLabels: () => setShowLabels(v => !v),
    onWheel: viewport.handleWheel,
    onMouseDown: viewport.handleMouseDown,
    onResetTransform: viewport.resetTransform,
  };

  const editorValue = {
    projectName: state.name, hasImage: !!state.sourceImage, saveStatus,
    canUndo, canRedo, isLoading: !!isLoading,
    selectedColorId, onSelectColor: setSelectedColorId,
    onExportClick: () => setExportModalOpen(true),
    onReplaceImage: () => replaceRef.current?.open(),
    onRename: renameName, onUndo: handleUndo, onRedo: handleRedo,
  };

  return (
    <CanvasContext.Provider value={canvasValue}>
    <EditorContext.Provider value={editorValue}>
    <PaletteContext.Provider value={paletteValue}>
    <FilterContext.Provider value={filterValue}>
      <AppShell header={{ height: 68 }} padding={0}>
        <ErrorBoundary label="Header" compact>
          <AppHeader />
        </ErrorBoundary>
        <AppShell.Main style={{ background: 'var(--mantine-color-dark-9)', paddingTop: "calc(var(--app-shell-header-height) + 4px)" }}>
          {isLoading ? (
            <Center h="calc(100vh - var(--app-shell-header-height))"><Loader color="primary" /></Center>
          ) : (
            <EditorTabs height="calc(100vh - var(--app-shell-header-height))" />
          )}
        </AppShell.Main>
        <ExportModal opened={exportModalOpen} state={state} onClose={() => setExportModalOpen(false)} />
        <ReplaceImageModal ref={replaceRef} hasSamples={state.palette.some(c => c.sample)} onFileSelected={handleFileSelected} />
      </AppShell>
    </FilterContext.Provider>
    </PaletteContext.Provider>
    </EditorContext.Provider>
    </CanvasContext.Provider>
  );
}
