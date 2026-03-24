import { useCallback, useEffect, useRef, useState } from 'react';
import { AppShell, Box, Center, Group, Loader } from '@mantine/core';

import { useProjectState } from './hooks/useProjectState';
import { useHistory } from './hooks/useHistory';
import { useSaveStatus } from './hooks/useSaveStatus';
import { useCanvasPipeline } from './hooks/useCanvasPipeline';
import { useViewportTransform } from './hooks/useViewportTransform';
import { useImageHandlers } from './hooks/useImageHandlers';
import { useEditorHotkeys } from './hooks/useEditorHotkeys';
import { FilterPanel } from './components/FilterPanel';
import { PaletteSidebar } from './components/PaletteSidebar';
import { ImageUploader } from './components/ImageUploader';
import { CanvasViewport } from './components/CanvasViewport';
import { SamplerOverlay } from './components/SamplerOverlay';
import { AppHeader } from './components/AppHeader';
import { ExportModal } from './components/ExportModal';
import { FilterContextMenu } from './components/FilterContextMenu';
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
  const { state, restoreState, addFilter, removeFilter, updateFilter, updateFilterPreview, reorderFilters, setPreIndexingBlur,
    addColor, removeColor, addGroup, removeGroup, renameGroup, setColorGroup, reorderGroups,
    setPalette, setImage, updateColor, renameName } = project;
  const filteredCanvasRef = useRef<HTMLCanvasElement>(null);
  const indexedCanvasRef = useRef<HTMLCanvasElement>(null);
  const pipeline = useCanvasPipeline(filteredCanvasRef, indexedCanvasRef);
  const viewport = useViewportTransform();
  const [samplingColorId, setSamplingColorId] = useState<string | null>(null);
  const [samplingLevels, setSamplingLevels] = useState<SamplingLevels>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);

  const { handleImageLoad, handleColorChange, handleAddColor, handleDeleteColor,
    handleToggleHighlight, handleSample, handleCancelSample, handleSampleLevels } = useImageHandlers({
    state, pipeline, setImage, updateColor, addColor, removeColor, updateFilter,
    samplingColorId, setSamplingColorId, samplingLevels, setSamplingLevels,
  });

  const handleUndo = useCallback(() => {
    const prev = historyUndo();
    if (prev) { restoreState(prev); save(prev); }
  }, [historyUndo, restoreState, save]);

  const handleRedo = useCallback(() => {
    const next = historyRedo();
    if (next) { restoreState(next); save(next); }
  }, [historyRedo, restoreState, save]);

  const handleFileSelected = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => handleImageLoad(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (onNewImageFile) onNewImageFile(file);
  }, [handleImageLoad, onNewImageFile]);

  useEffect(() => {
    if (state.imageDataUrl) viewport.resetTransform();
  }, [state.imageDataUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const { filterMenuOpen, filterMenuPos, onFilterMenuClose, openFilterMenu } = useEditorHotkeys({
    onUndo: handleUndo, onRedo: handleRedo, onAddFilter: addFilter, onAddColor: handleAddColor,
  });

  const paletteValue = {
    palette: state.palette, groups: state.groups ?? [], blur: state.preIndexingBlur, samplingColorId,
    onBlurChange: setPreIndexingBlur,
    onStartSampling: (id) => { setSamplingLevels(null); setSamplingColorId(id); },
    onColorChange: handleColorChange,
    onRenameColor: (id, name) => updateColor(id, { name }),
    onAddColor: handleAddColor, onDeleteColor: handleDeleteColor, onToggleHighlight: handleToggleHighlight,
    onAddGroup: addGroup, onRemoveGroup: removeGroup, onRenameGroup: renameGroup,
    onSetColorGroup: setColorGroup, onReorderPalette: setPalette, onReorderGroups: reorderGroups,
  };

  const filterValue = {
    filters: state.filters, samplingLevels,
    onAddFilter: addFilter, onRemoveFilter: removeFilter,
    onUpdateFilter: updateFilter, onPreviewFilter: updateFilterPreview, onReorderFilters: reorderFilters,
    onStartSamplingLevels: (filterId, point) => { setSamplingColorId(null); setSamplingLevels({ filterId, point }); },
    onOpenFilterMenu: openFilterMenu,
  };

  const canvasValue = {
    filteredCanvasRef, indexedCanvasRef,
    viewportTransform: viewport.transform,
    isDragging: viewport.isDragging,
    isSampling: !!samplingColorId || !!samplingLevels,
    onWheel: viewport.handleWheel,
    onMouseDown: viewport.handleMouseDown,
    onResetTransform: viewport.resetTransform,
  };

  const editorValue = {
    projectName: state.name, hasImage: !!state.imageDataUrl, saveStatus,
    canUndo, canRedo, isLoading: !!isLoading,
    onExportClick: () => setExportModalOpen(true), onRename: renameName,
    onUndo: handleUndo, onRedo: handleRedo,
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

        <AppShell.Navbar style={{ background: 'var(--mantine-color-dark-8)', borderRight: '1px solid var(--mantine-color-dark-6)', overflowY: 'auto' }}>
          <FilterPanel collapsed={navbarCollapsed} onToggleCollapse={() => setNavbarCollapsed(v => !v)} />
        </AppShell.Navbar>

        <AppShell.Main style={{ background: 'var(--mantine-color-dark-9)' }}>
          {isLoading ? (
            <Center h="calc(100vh - var(--app-shell-header-height))"><Loader color="primary" /></Center>
          ) : !state.imageDataUrl ? (
            <Box p="xl"><ImageUploader onFileSelected={handleFileSelected} /></Box>
          ) : (
            <Group align="flex-start" style={{ height: 'calc(100vh - var(--app-shell-header-height))', gap: 0, overflow: 'hidden' }}>
              <CanvasViewport ref={filteredCanvasRef} label="Filtered Original">
                {samplingColorId && <SamplerOverlay onSample={handleSample} onCancel={handleCancelSample} />}
                {samplingLevels && <SamplerOverlay onSample={handleSampleLevels} onCancel={() => setSamplingLevels(null)} />}
              </CanvasViewport>
              <CanvasViewport ref={indexedCanvasRef} label="Indexed Result" />
            </Group>
          )}
        </AppShell.Main>

        <AppShell.Aside style={{ background: 'var(--mantine-color-dark-8)', borderLeft: '1px solid var(--mantine-color-dark-6)', overflowY: 'auto', scrollbarWidth: 'none' }} className="hide-scrollbar">
          <PaletteSidebar />
        </AppShell.Aside>

        <ExportModal opened={exportModalOpen} state={state} onClose={() => setExportModalOpen(false)} />
        <FilterContextMenu opened={filterMenuOpen} position={filterMenuPos} onClose={onFilterMenuClose} onAdd={addFilter} />
      </AppShell>
    </FilterContext.Provider>
    </PaletteContext.Provider>
    </EditorContext.Provider>
    </CanvasContext.Provider>
  );
}
