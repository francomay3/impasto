import { useCallback, useRef, useState } from 'react';
import { AppShell, Box, Center, Group, Loader, Stack } from '@mantine/core';

import { useProjectState } from './hooks/useProjectState';
import { useHistory } from './hooks/useHistory';
import { useSaveStatus } from './hooks/useSaveStatus';
import { useCanvasPipeline } from './hooks/useCanvasPipeline';
import { useViewportTransform } from './hooks/useViewportTransform';
import { useImageHandlers } from './hooks/useImageHandlers';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useEditorHotkeys } from './hooks/useEditorHotkeys';
import { FilterPanel } from './components/FilterPanel';
import { PaletteSidebar } from './components/PaletteSidebar';
import { ImageUploader } from './components/ImageUploader';
import { CanvasViewport } from './components/CanvasViewport';
import { SamplerOverlay } from './components/SamplerOverlay';
import { SamplePinsOverlay } from './components/SamplePinsOverlay';
import { ReplaceImageModal, type ReplaceImageModalRef } from './components/ReplaceImageModal';
import { AppHeader } from './components/AppHeader';
import { ExportModal } from './components/ExportModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ViewportToolbar } from './components/ViewportToolbar';
import { FilteredViewportControls } from './components/FilteredViewportControls';
import { IndexedViewportControls } from './components/IndexedViewportControls';
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
  const [samplingLevels, setSamplingLevels] = useState<SamplingLevels>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);
  const replaceRef = useRef<ReplaceImageModalRef>(null);

  const { handleImageLoad, handleAddColor, handleAddColorAtPosition, handleDeleteColor,
    handleToggleHighlight, handleSample, handleCancelSample, handleSampleLevels } = useImageHandlers({
    state, pipeline, setImage, updateColor, setPalette: updateDerivedPalette, addSampledColor, removeColor, updateFilter,
    samplingColorId, setSamplingColorId, samplingLevels, setSamplingLevels,
    resetTransform: viewport.resetTransform,
  });

  const { handleUndo, handleRedo } = useUndoRedo({ historyUndo, historyRedo, restoreState, save });

  const handleFileSelected = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => handleImageLoad(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (onNewImageFile) onNewImageFile(file);
  }, [handleImageLoad, onNewImageFile]);

  useEditorHotkeys({ onUndo: handleUndo, onRedo: handleRedo, onAddFilter: addFilter, onAddColor: handleAddColor });

  const paletteValue = {
    palette: state.palette, groups: state.groups ?? [], samplingColorId,
    onStartSampling: (id) => { setSamplingLevels(null); setSamplingColorId(id); },
    onRenameColor: (id, name) => updateColor(id, { name }),
    onAddColor: handleAddColor, onAddColorAtPosition: handleAddColorAtPosition, onDeleteColor: handleDeleteColor, onToggleHighlight: handleToggleHighlight,
    onAddGroup: addGroup, onRemoveGroup: removeGroup, onRenameGroup: renameGroup,
    onSetColorGroup: setColorGroup, onReorderPalette: setPalette, onReorderGroups: reorderGroups,
  };

  const filterValue = {
    filters: state.filters, samplingLevels,
    onAddFilter: addFilter, onDuplicateFilter: duplicateFilter, onRemoveFilter: removeFilter,
    onUpdateFilter: updateFilter, onPreviewFilter: updateFilterPreview, onReorderFilters: reorderFilters,
    onStartSamplingLevels: (filterId, point) => { setSamplingColorId(null); setSamplingLevels({ filterId, point }); },
  };

  const canvasValue = {
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
    projectName: state.name, hasImage: !!state.imageDataUrl, saveStatus,
    canUndo, canRedo, isLoading: !!isLoading,
    onExportClick: () => setExportModalOpen(true),
    onReplaceImage: () => replaceRef.current?.open(),
    onRename: renameName, onUndo: handleUndo, onRedo: handleRedo,
  };

  return (
    <CanvasContext.Provider value={canvasValue}>
    <EditorContext.Provider value={editorValue}>
    <PaletteContext.Provider value={paletteValue}>
    <FilterContext.Provider value={filterValue}>
      <AppShell
        header={{ height: 68 }}
        navbar={{ width: navbarCollapsed ? 52 : 260, breakpoint: 'sm' }}
        aside={{ width: 260, breakpoint: 'md', collapsed: { mobile: true } }}
        padding={0}
      >
        <AppHeader />

        <AppShell.Navbar style={{ background: 'var(--mantine-color-dark-8)', borderRight: '1px solid var(--mantine-color-dark-6)', overflow: 'hidden' }}>
          <ErrorBoundary label="Filter panel" compact>
            <FilterPanel collapsed={navbarCollapsed} onToggleCollapse={() => setNavbarCollapsed(v => !v)} />
          </ErrorBoundary>
        </AppShell.Navbar>

        <AppShell.Main style={{ background: 'var(--mantine-color-dark-9)' }}>
          {isLoading ? (
            <Center h="calc(100vh - var(--app-shell-header-height))"><Loader color="primary" /></Center>
          ) : !state.imageDataUrl ? (
            <Box p="xl"><ImageUploader onFileSelected={handleFileSelected} /></Box>
          ) : (
            <ErrorBoundary label="Canvas" compact>
              <Stack gap={0} style={{ height: 'calc(100vh - var(--app-shell-header-height))', overflow: 'hidden' }}>
                <ViewportToolbar
                  left={<FilteredViewportControls />}
                  right={<IndexedViewportControls blur={state.preIndexingBlur} onBlurChange={setPreIndexingBlur} />}
                />
                <Group align="flex-start" style={{ flex: 1, gap: 0, overflow: 'hidden' }}>
                  <CanvasViewport ref={filteredCanvasRef}>
                    <SamplePinsOverlay />
                    {samplingColorId && <SamplerOverlay onSample={handleSample} onCancel={handleCancelSample} />}
                    {samplingLevels && <SamplerOverlay onSample={handleSampleLevels} onCancel={() => setSamplingLevels(null)} />}
                  </CanvasViewport>
                  <CanvasViewport ref={indexedCanvasRef} variant="indexed" />
                </Group>
              </Stack>
            </ErrorBoundary>
          )}
        </AppShell.Main>

        <AppShell.Aside style={{ background: 'var(--mantine-color-dark-8)', borderLeft: '1px solid var(--mantine-color-dark-6)', overflowY: 'auto', scrollbarWidth: 'none' }} className="hide-scrollbar">
          <ErrorBoundary label="Palette sidebar" compact>
            <PaletteSidebar />
          </ErrorBoundary>
        </AppShell.Aside>

        <ExportModal opened={exportModalOpen} state={state} onClose={() => setExportModalOpen(false)} />
        <ReplaceImageModal ref={replaceRef} hasSamples={state.palette.some(c => c.sample)} onFileSelected={handleFileSelected} />
      </AppShell>
    </FilterContext.Provider>
    </PaletteContext.Provider>
    </EditorContext.Provider>
    </CanvasContext.Provider>
  );
}
