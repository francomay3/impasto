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
import { useHiddenPins } from './hooks/useHiddenPins';
import { useEditorHandlers } from './hooks/useEditorHandlers';
import { ReplaceImageModal, type ReplaceImageModalRef } from './components/ReplaceImageModal';
import { AppHeader } from './components/AppHeader';
import { ExportModal } from './components/ExportModal';
import { EditorTabs } from './components/EditorTabs';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PaletteContext } from './context/PaletteContext';
import { FilterContext } from './context/FilterContext';
import { EditorContext } from './context/EditorContext';
import { CanvasContext } from './context/CanvasContext';
import { ToolContext } from './context/ToolContext';
import { SelectionPopoverProvider } from './context/SelectionPopoverContext';
import type { ToolId } from './tools';
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
  const { state, restoreState, addFilter, duplicateFilter, removeFilter, updateFilter, updateFilterPreview, reorderFilters,
    addSampledColor, removeColor, addGroup, removeGroup, renameGroup, setColorGroup, reorderGroups,
    setPalette, updateDerivedPalette, setImage, updateColor, renameName } = project;
  const filteredCanvasRef = useRef<HTMLCanvasElement>(null);
  const indexedCanvasRef = useRef<HTMLCanvasElement>(null);
  const pipeline = useCanvasPipeline(filteredCanvasRef, indexedCanvasRef);
  const viewport = useViewportTransform();
  const replaceRef = useRef<ReplaceImageModalRef>(null);
  const [samplingColorId, setSamplingColorId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [hoveredColorId, setHoveredColorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('filters');
  const [samplingLevels, setSamplingLevels] = useState<SamplingLevels | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const { hiddenPinIds, onTogglePinVisibility, onSetGroupPinsVisible } = useHiddenPins();

  const { handleImageLoadBitmap, handleAddColor, handleAddColorAtPosition, handleDeleteColor,
    handleSample, handleCancelSample, handleSampleLevels, handlePinMoveEnd } = useImageHandlers({
    state, pipeline, setImage, updateColor, setPalette: updateDerivedPalette, addSampledColor, removeColor, updateFilter,
    samplingColorId, setSamplingColorId, samplingLevels, setSamplingLevels, resetTransform: viewport.resetTransform,
  });

  const { handleUndo, handleRedo } = useUndoRedo({ historyUndo, historyRedo, restoreState, save });

  const {
    selectedColorIds, setSelectedColorIds,
    handleSelectColor, handleToggleColorSelection,
    handleFileSelected, handleEnterAddColorMode, handleAddNewColor,
    handleSampleWithSelect, handleDeleteSelectedColors, handleToggleSelectTool, handleToggleMarqueeTool, handlePasteFile,
  } = useEditorHandlers({
    state, activeTool, samplingColorId,
    handleAddColorAtPosition, handleSample, handleDeleteColor, handleImageLoadBitmap,
    setActiveTool, setActiveTab, replaceRef, onNewImageFile,
  });

  useEditorHotkeys({
    onUndo: handleUndo, onRedo: handleRedo, onAddFilter: addFilter,
    onAddColor: handleEnterAddColorMode,
    onClearSelection: () => setSelectedColorIds(new Set()),
    onDeleteSelectedColor: handleDeleteSelectedColors,
    onPasteFile: handlePasteFile, setActiveTool,
    onToggleSelectTool: handleToggleSelectTool,
    onToggleMarqueeTool: handleToggleMarqueeTool,
  });

  const paletteValue = {
    palette: state.palette, groups: state.groups ?? [], samplingColorId,
    isAddingColor: activeTool === 'eyedropper',
    onStartSampling: (id: string) => { setSamplingLevels(null); setActiveTool(null); setSamplingColorId(id); },
    onSampleColor: handleSampleWithSelect, onCancelSampleColor: handleCancelSample,
    onAddNewColor: handleAddNewColor, onCancelAddingColor: () => setActiveTool(null),
    onRenameColor: (id: string, name: string) => updateColor(id, { name }),
    onAddColor: handleAddColor, onAddColorAtPosition: handleAddColorAtPosition, onDeleteColor: handleDeleteColor,
    onPinMoveEnd: handlePinMoveEnd, onRemoveSamplePin: (id: string) => updateColor(id, { sample: undefined }),
    onAddGroup: addGroup, onRemoveGroup: removeGroup, onRenameGroup: renameGroup,
    onSetColorGroup: setColorGroup, onReorderPalette: setPalette, onReorderGroups: reorderGroups,
  };

  const filterValue = {
    filters: state.filters, preIndexingBlur: state.preIndexingBlur, samplingLevels,
    onAddFilter: addFilter, onDuplicateFilter: duplicateFilter, onRemoveFilter: removeFilter,
    onUpdateFilter: updateFilter, onPreviewFilter: updateFilterPreview, onReorderFilters: reorderFilters,
    onStartSamplingLevels: (filterId: string, point: 'black' | 'white') => { setSamplingColorId(null); setSamplingLevels({ filterId, point }); },
    onSampleLevels: handleSampleLevels, onCancelSamplingLevels: () => setSamplingLevels(null),
  };

  const canvasValue = {
    sourceImage: state.sourceImage, filteredCanvasRef, indexedCanvasRef,
    viewportTransform: viewport.transform, isDragging: viewport.isDragging,
    isSampling: activeTool === 'eyedropper' || !!samplingColorId || !!samplingLevels,
    showLabels, onToggleLabels: () => setShowLabels(v => !v),
    onWheel: viewport.handleWheel, onMouseDown: viewport.handleMouseDown, onResetTransform: viewport.resetTransform,
  };

  const editorValue = {
    projectName: state.name, hasImage: !!state.sourceImage, saveStatus, canUndo, canRedo, isLoading: !!isLoading,
    selectedColorIds, onSelectColor: handleSelectColor,
    onToggleColorSelection: handleToggleColorSelection, onSetSelection: setSelectedColorIds,
    hoveredColorId, onHoverColor: setHoveredColorId,
    onExportClick: () => setExportModalOpen(true), onReplaceImage: () => replaceRef.current?.open(),
    onFileSelected: handleFileSelected, onRename: renameName, onUndo: handleUndo, onRedo: handleRedo,
    activeTab, onSetActiveTab: setActiveTab, hiddenPinIds, onTogglePinVisibility, onSetGroupPinsVisible,
  };

  return (
    <ToolContext.Provider value={{ activeTool, setActiveTool }}>
    <CanvasContext.Provider value={canvasValue}>
    <EditorContext.Provider value={editorValue}>
    <PaletteContext.Provider value={paletteValue}>
    <SelectionPopoverProvider>
    <FilterContext.Provider value={filterValue}>
      <AppShell header={{ height: 68 }} padding={0}>
        <ErrorBoundary label="Header" compact>
          <AppHeader />
        </ErrorBoundary>
        <AppShell.Main onClick={() => handleSelectColor(null)} style={{ background: 'var(--mantine-color-dark-9)', paddingTop: "calc(var(--app-shell-header-height) + 4px)" }}>
          {isLoading
            ? <Center h="calc(100vh - var(--app-shell-header-height))"><Loader color="primary" /></Center>
            : <EditorTabs height="calc(100vh - var(--app-shell-header-height))" />}
        </AppShell.Main>
        <ExportModal opened={exportModalOpen} state={state} onClose={() => setExportModalOpen(false)} />
        <ReplaceImageModal ref={replaceRef} hasSamples={state.palette.some(c => c.sample)} onFileSelected={handleFileSelected} />
      </AppShell>
    </FilterContext.Provider>
    </SelectionPopoverProvider>
    </PaletteContext.Provider>
    </EditorContext.Provider>
    </CanvasContext.Provider>
    </ToolContext.Provider>
  );
}
