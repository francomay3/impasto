import { useEffect, useRef, useState } from 'react';
import { AppShell, Box, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { useProjectState } from './hooks/useProjectState';
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

type SamplingLevels = { filterId: string; point: 'black' | 'white' } | null;

export default function App() {
  const project = useProjectState();
  const { state, addFilter, removeFilter, updateFilter, reorderFilters, setPreIndexingBlur,
    addColor, removeColor, addGroup, removeGroup, renameGroup, setColorGroup, reorderGroups,
    setPalette, setImage, updateColor } = project;
  const filteredCanvasRef = useRef<HTMLCanvasElement>(null);
  const indexedCanvasRef = useRef<HTMLCanvasElement>(null);
  const pipeline = useCanvasPipeline(filteredCanvasRef, indexedCanvasRef);
  const viewport = useViewportTransform();
  const [samplingColorId, setSamplingColorId] = useState<string | null>(null);
  const [samplingLevels, setSamplingLevels] = useState<SamplingLevels>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);

  const { handleImageLoad, handleColorChange, handleAddColor, handleDeleteColor,
    handleToggleHighlight, handleSample, handleSampleLevels, handleFileInput } = useImageHandlers({
    state, pipeline, setImage, updateColor, addColor, removeColor, updateFilter,
    samplingColorId, setSamplingColorId, samplingLevels, setSamplingLevels,
  });

  useEffect(() => {
    if (state.imageDataUrl) viewport.resetTransform();
  }, [state.imageDataUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        notifications.show({ message: 'Project saved', color: 'blue' });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <AppShell
      header={{ height: 52 }}
      navbar={{ width: navbarCollapsed ? 52 : 260, breakpoint: 'sm' }}
      aside={{ width: 260, breakpoint: 'md', collapsed: { mobile: true } }}
      padding={0}
    >
      <AppHeader hasImage={!!state.imageDataUrl} onExportClick={() => setExportModalOpen(true)} onFileChange={handleFileInput} />

      <AppShell.Navbar style={{ background: 'var(--mantine-color-dark-8)', borderRight: '1px solid var(--mantine-color-dark-6)', overflowY: 'auto' }}>
        <FilterPanel
          filters={state.filters} onAddFilter={addFilter} onRemoveFilter={removeFilter}
          onUpdateFilter={updateFilter} onReorderFilters={reorderFilters}
          collapsed={navbarCollapsed} onToggleCollapse={() => setNavbarCollapsed(v => !v)}
          samplingLevels={samplingLevels}
          onStartSamplingLevels={(filterId, point) => { setSamplingColorId(null); setSamplingLevels({ filterId, point }); }}
        />
      </AppShell.Navbar>

      <AppShell.Main style={{ background: 'var(--mantine-color-dark-9)' }}>
        {!state.imageDataUrl ? (
          <Box p="xl"><ImageUploader onImageLoad={handleImageLoad} /></Box>
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
