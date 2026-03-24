import { useCallback, useEffect, useRef, useState } from 'react';
import { AppShell, Box, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { useProjectState } from './hooks/useProjectState';
import { useHistory } from './hooks/useHistory';
import { useSaveStatus } from './hooks/useSaveStatus';
import { useCanvasPipeline } from './hooks/useCanvasPipeline';
import { useViewportTransform } from './hooks/useViewportTransform';
import { useImageHandlers } from './hooks/useImageHandlers';
import { FilterPanel } from './components/FilterPanel';
import { PaletteSidebar } from './components/PaletteSidebar';
import { ImageUploader } from './components/ImageUploader';
import { CanvasViewport } from './components/CanvasViewport';
import { SamplerOverlay } from './components/SamplerOverlay';
import { AppHeader } from './components/AppHeader';
import { ExportModal } from './components/ExportModal';
import type { ProjectState } from './types';

type SamplingLevels = { filterId: string; point: 'black' | 'white' } | null;

interface AppProps {
  initialState: ProjectState;
  onSave: (state: ProjectState) => void | Promise<void>;
  onNewImageFile?: (file: File) => void;
}

export default function Editor({ initialState, onSave, onNewImageFile }: AppProps) {
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
    handleToggleHighlight, handleSample, handleSampleLevels } = useImageHandlers({
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 's') { e.preventDefault(); notifications.show({ message: 'Project saved', color: 'blue' }); }
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleUndo, handleRedo]);

  return (
    <AppShell
      header={{ height: 68 }}
      navbar={{ width: navbarCollapsed ? 52 : 260, breakpoint: 'sm' }}
      aside={{ width: 260, breakpoint: 'md', collapsed: { mobile: true } }}
      padding={0}
    >
      <AppHeader
        projectName={state.name}
        hasImage={!!state.imageDataUrl}
        onExportClick={() => setExportModalOpen(true)}
        onRename={renameName}
        onAddFilter={addFilter}
        onAddColor={handleAddColor}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        saveStatus={saveStatus}
      />

      <AppShell.Navbar style={{ background: 'var(--mantine-color-dark-8)', borderRight: '1px solid var(--mantine-color-dark-6)', overflowY: 'auto' }}>
        <FilterPanel
          filters={state.filters} onAddFilter={addFilter} onRemoveFilter={removeFilter}
          onUpdateFilter={updateFilter} onPreviewFilter={updateFilterPreview} onReorderFilters={reorderFilters}
          collapsed={navbarCollapsed} onToggleCollapse={() => setNavbarCollapsed(v => !v)}
          samplingLevels={samplingLevels}
          onStartSamplingLevels={(filterId, point) => { setSamplingColorId(null); setSamplingLevels({ filterId, point }); }}
        />
      </AppShell.Navbar>

      <AppShell.Main style={{ background: 'var(--mantine-color-dark-9)' }}>
        {!state.imageDataUrl ? (
          <Box p="xl"><ImageUploader onFileSelected={handleFileSelected} /></Box>
        ) : (
          <Group align="flex-start" style={{ height: 'calc(100vh - var(--app-shell-header-height))', gap: 0, overflow: 'hidden' }}>
            <CanvasViewport ref={filteredCanvasRef} label="Filtered Original" viewportTransform={viewport.transform}
              onWheel={viewport.handleWheel} onMouseDown={viewport.handleMouseDown} onDoubleClick={viewport.resetTransform}
              isDragging={viewport.isDragging} isSampling={!!samplingColorId || !!samplingLevels}>
              {samplingColorId && <SamplerOverlay filteredCanvasRef={filteredCanvasRef} onSample={handleSample} onCancel={() => setSamplingColorId(null)} viewportScale={viewport.transform.scale} />}
              {samplingLevels && <SamplerOverlay filteredCanvasRef={filteredCanvasRef} onSample={handleSampleLevels} onCancel={() => setSamplingLevels(null)} viewportScale={viewport.transform.scale} />}
            </CanvasViewport>
            <CanvasViewport ref={indexedCanvasRef} label="Indexed Result" viewportTransform={viewport.transform}
              onWheel={viewport.handleWheel} onMouseDown={viewport.handleMouseDown} onDoubleClick={viewport.resetTransform}
              isDragging={viewport.isDragging} isSampling={!!samplingColorId || !!samplingLevels} />
          </Group>
        )}
      </AppShell.Main>

      <AppShell.Aside style={{ background: 'var(--mantine-color-dark-8)', borderLeft: '1px solid var(--mantine-color-dark-6)', overflowY: 'auto', scrollbarWidth: 'none' }} className="hide-scrollbar">
        <PaletteSidebar
          palette={state.palette} groups={state.groups ?? []} blur={state.preIndexingBlur} samplingColorId={samplingColorId}
          onBlurChange={setPreIndexingBlur} onStartSampling={(id) => { setSamplingLevels(null); setSamplingColorId(id); }}
          onColorChange={handleColorChange} onRenameColor={(id, name) => updateColor(id, { name })}
          onAddColor={handleAddColor} onDeleteColor={handleDeleteColor} onToggleHighlight={handleToggleHighlight}
          onAddGroup={addGroup} onRemoveGroup={removeGroup} onRenameGroup={renameGroup}
          onSetColorGroup={setColorGroup} onReorderPalette={setPalette} onReorderGroups={reorderGroups}
        />
      </AppShell.Aside>

      <ExportModal opened={exportModalOpen} defaultTitle={state.name} state={state}
        filteredCanvasRef={filteredCanvasRef} indexedCanvasRef={indexedCanvasRef}
        onClose={() => setExportModalOpen(false)} />
    </AppShell>
  );
}
