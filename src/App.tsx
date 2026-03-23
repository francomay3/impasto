import { useCallback, useEffect, useRef, useState } from 'react';
import { AppShell, Box, Button, Checkbox, Group, Modal, NumberInput, SimpleGrid, Stack, Text, TextInput, Title, useMantineTheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDebouncedValue } from '@mantine/hooks';
import { FileImage, Download, Brush } from 'lucide-react';

import { useProjectState } from './hooks/useProjectState';
import { useCanvasPipeline } from './hooks/useCanvasPipeline';
import { useViewportTransform } from './hooks/useViewportTransform';
import { FilterPanel } from './components/FilterPanel';
import { PaletteSidebar } from './components/PaletteSidebar';
import { ImageUploader } from './components/ImageUploader';
import { CanvasViewport } from './components/CanvasViewport';
import { SamplerOverlay } from './components/SamplerOverlay';
import { exportPdf } from './services/PdfExport';
import { DEFAULT_MIX_GRANULARITY, DEFAULT_DELTA_THRESHOLD, PIGMENTS } from './services/ColorMixer';

export default function App() {
  const theme = useMantineTheme();
  const { state, setImage, setPalette, updateColor, setFilters, addColor, removeColor, addGroup, removeGroup, renameGroup, setColorGroup, reorderGroups } = useProjectState();
  const pipeline = useCanvasPipeline();
  const viewport = useViewportTransform();
  const [samplingColorId, setSamplingColorId] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);
  const [exportTitle, setExportTitle] = useState('');
  const [exportGranularity, setExportGranularity] = useState(DEFAULT_MIX_GRANULARITY);
  const [exportDelta, setExportDelta] = useState(DEFAULT_DELTA_THRESHOLD);
  const [exportPigments, setExportPigments] = useState<Set<string>>(() => new Set(PIGMENTS.map(p => p.name)));
  const [debouncedFilters] = useDebouncedValue(state.filters, 300);
  const lastImageDataRef = useRef<ImageData | null>(null);

  const renderPalette = useCallback((imageData?: ImageData, palette?: typeof state.palette) => {
    const data = imageData ?? lastImageDataRef.current;
    if (!data) return;
    const forIndexing = pipeline.blurImageData(data, state.filters.blur);
    pipeline.renderIndexed(palette ?? state.palette, forIndexing);
  }, [pipeline, state.filters.blur, state.palette]);

  // Reset zoom/pan on new image
  useEffect(() => {
    if (state.imageDataUrl) viewport.resetTransform();
  }, [state.imageDataUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load image when imageDataUrl changes
  useEffect(() => {
    if (!state.imageDataUrl) return;
    pipeline.loadImage(state.imageDataUrl).then(() => {
      const imageData = pipeline.applyFilterPipeline(debouncedFilters);
      if (imageData) {
        lastImageDataRef.current = imageData;
        renderPalette(imageData);
      }
    });
  }, [state.imageDataUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-apply filters and re-render when filters change (debounced)
  useEffect(() => {
    if (!state.imageDataUrl) return;
    const imageData = pipeline.applyFilterPipeline(debouncedFilters);
    if (imageData) {
      lastImageDataRef.current = imageData;
      renderPalette(imageData);
    }
  }, [debouncedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl+S shortcut
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

  const handleImageLoad = useCallback((dataUrl: string) => {
    setImage(dataUrl);
  }, [setImage]);

  const handleColorChange = useCallback((id: string, hex: string) => {
    updateColor(id, { hex });
    renderPalette(undefined, state.palette.map(c => c.id === id ? { ...c, hex } : c));
  }, [updateColor, renderPalette, state.palette]);

  const handleAddColor = useCallback(() => {
    const id = crypto.randomUUID();
    addColor(id);
    renderPalette(undefined, [...state.palette, { id, hex: '#000000', locked: false, ratio: 0, mixRecipe: '' }]);
    setSamplingColorId(id);
  }, [addColor, renderPalette, state.palette]);

  const handleDeleteColor = useCallback((id: string) => {
    removeColor(id);
    renderPalette(undefined, state.palette.filter(c => c.id !== id));
  }, [removeColor, renderPalette, state.palette]);

  const handleToggleHighlight = useCallback((id: string) => {
    const highlighted = !state.palette.find(c => c.id === id)?.highlighted;
    updateColor(id, { highlighted });
    renderPalette(undefined, state.palette.map(c => c.id === id ? { ...c, highlighted } : c));
  }, [updateColor, renderPalette, state.palette]);

  const handleSample = useCallback((hex: string) => {
    if (!samplingColorId) return;
    updateColor(samplingColorId, { hex });
    setSamplingColorId(null);
    renderPalette(undefined, state.palette.map(c => c.id === samplingColorId ? { ...c, hex } : c));
    notifications.show({ message: `Color sampled: ${hex}`, color: 'teal' });
  }, [samplingColorId, updateColor, renderPalette, state.palette]);

  const handleExportPdf = useCallback(() => {
    if (!pipeline.filteredCanvasRef.current || !pipeline.indexedCanvasRef.current) return;
    const pigments = PIGMENTS.filter(p => exportPigments.has(p.name));
    exportPdf(state, pipeline.filteredCanvasRef.current, pipeline.indexedCanvasRef.current, exportGranularity, exportDelta, pigments, exportTitle || state.name);
    setExportModalOpen(false);
    notifications.show({ message: 'Export complete', color: 'green' });
  }, [pipeline, state, exportGranularity, exportDelta, exportPigments]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => handleImageLoad(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <AppShell
      header={{ height: 52 }}
      navbar={{ width: navbarCollapsed ? 52 : 260, breakpoint: 'sm' }}
      aside={{ width: 260, breakpoint: 'md', collapsed: { mobile: true } }}
      padding={0}
    >
      <AppShell.Header style={{ background: '#111', borderBottom: '1px solid #222' }}>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs" align="center">
            <Brush size={18} color={theme.colors[theme.primaryColor][5]} />
            <Title order={5}>Artist Toolbox</Title>
          </Group>
          <Group gap="xs">
            {state.imageDataUrl && (
              <Button size="xs" variant="light" leftSection={<Download size={14} />}
                onClick={() => { setExportTitle(state.name); setExportModalOpen(true); }}>Export PDF</Button>
            )}
            <Button size="xs" variant="subtle" leftSection={<FileImage size={14} />}
              onClick={() => document.getElementById('file-upload-hidden')?.click()}>
              Load Image
            </Button>
            <input id="file-upload-hidden" type="file" accept="image/*"
              style={{ display: 'none' }} onChange={handleFileInput} />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar style={{ background: '#161616', borderRight: '1px solid #222', overflowY: 'auto' }}>
        <FilterPanel
          filters={state.filters}
          onChange={setFilters}
          collapsed={navbarCollapsed}
          onToggleCollapse={() => setNavbarCollapsed(v => !v)}
        />
      </AppShell.Navbar>

      <AppShell.Main style={{ background: '#0d0d0d' }}>
        {!state.imageDataUrl ? (
          <Box p="xl">
            <ImageUploader onImageLoad={handleImageLoad} />
          </Box>
        ) : (
          <Group align="flex-start" style={{ height: 'calc(100vh - var(--app-shell-header-height))', gap: 0, overflow: 'hidden' }}>
            <CanvasViewport
              ref={pipeline.filteredCanvasRef}
              label="Filtered Original"
              viewportTransform={viewport.transform}
              onWheel={viewport.handleWheel}
              onMouseDown={viewport.handleMouseDown}
              onDoubleClick={viewport.resetTransform}
              isDragging={viewport.isDragging}
              isSampling={!!samplingColorId}
            >
              {samplingColorId && (
                <SamplerOverlay
                  filteredCanvasRef={pipeline.filteredCanvasRef}
                  onSample={handleSample}
                  onCancel={() => setSamplingColorId(null)}
                />
              )}
            </CanvasViewport>
            <CanvasViewport
              ref={pipeline.indexedCanvasRef}
              label="Indexed Result"
              viewportTransform={viewport.transform}
              onWheel={viewport.handleWheel}
              onMouseDown={viewport.handleMouseDown}
              onDoubleClick={viewport.resetTransform}
              isDragging={viewport.isDragging}
              isSampling={!!samplingColorId}
            />
          </Group>
        )}
      </AppShell.Main>

      <AppShell.Aside style={{ background: '#161616', borderLeft: '1px solid #222', overflowY: 'auto', scrollbarWidth: 'none' }} className="hide-scrollbar">
        <PaletteSidebar
          palette={state.palette}
          groups={state.groups ?? []}
          blur={state.filters.blur}
          samplingColorId={samplingColorId}
          onBlurChange={(v) => setFilters({ ...state.filters, blur: v })}
          onStartSampling={(id) => setSamplingColorId(id)}
          onColorChange={handleColorChange}
          onRenameColor={(id, name) => updateColor(id, { name })}
          onAddColor={handleAddColor}
          onDeleteColor={handleDeleteColor}
          onToggleHighlight={handleToggleHighlight}
          onAddGroup={addGroup}
          onRemoveGroup={removeGroup}
          onRenameGroup={renameGroup}
          onSetColorGroup={setColorGroup}
          onReorderPalette={setPalette}
          onReorderGroups={reorderGroups}
        />
      </AppShell.Aside>
      <Modal
        opened={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export PDF"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="PDF title"
            value={exportTitle}
            onChange={(e) => setExportTitle(e.currentTarget.value)}
          />
          <Stack gap={4}>
            <Text size="sm" fw={500}>Mix granularity</Text>
            <Text size="xs" c="dimmed">
              How many equal parts the palette is divided into when calculating paint ratios.
              Higher values give more precise proportions (e.g. 1:3, 1:4) but take longer to compute.
              12 is a good balance — it covers thirds, quarters, and halves cleanly.
            </Text>
            <NumberInput
              value={exportGranularity}
              onChange={(v) => setExportGranularity(Number(v))}
              min={4}
              max={24}
              step={1}
              size="sm"
            />
          </Stack>

          <Stack gap={4}>
            <Text size="sm" fw={500}>Color accuracy (ΔE)</Text>
            <Text size="xs" c="dimmed">
              How close a mixed color needs to be to the target before the search stops.
              Lower values demand a tighter match and may result in more pigments per recipe.
              Higher values accept a looser match and keep recipes simpler.
              A value of 6 is a practical threshold — differences below that are hard to notice in real paint.
            </Text>
            <NumberInput
              value={exportDelta}
              onChange={(v) => setExportDelta(Number(v))}
              min={1}
              max={30}
              step={1}
              size="sm"
            />
          </Stack>

          <Stack gap={4}>
            <Text size="sm" fw={500}>Pigments</Text>
            <Text size="xs" c="dimmed">
              Only the checked pigments will be considered when calculating mix recipes.
              Uncheck pigments you don't have in your studio.
            </Text>
            <SimpleGrid cols={2} spacing={6} mt={4}>
              {PIGMENTS.map(p => (
                <Checkbox
                  key={p.name}
                  size="xs"
                  checked={exportPigments.has(p.name)}
                  onChange={(e) => {
                    const checked = e.currentTarget.checked;
                    setExportPigments(prev => {
                      const next = new Set(prev);
                      if (checked) next.add(p.name); else next.delete(p.name);
                      return next;
                    });
                  }}
                  label={
                    <Group gap={6} wrap="nowrap">
                      <Box style={{ width: 10, height: 10, borderRadius: 2, background: p.hex, border: '1px solid #444', flexShrink: 0 }} />
                      <Text size="xs">{p.name}</Text>
                    </Group>
                  }
                />
              ))}
            </SimpleGrid>
          </Stack>

          <Group justify="flex-end" gap="xs">
            <Button variant="subtle" color="gray" onClick={() => setExportModalOpen(false)}>Cancel</Button>
            <Button leftSection={<Download size={14} />} onClick={handleExportPdf}>Export</Button>
          </Group>
        </Stack>
      </Modal>
    </AppShell>
  );
}
