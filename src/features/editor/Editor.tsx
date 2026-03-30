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
import { useHiddenPins } from './useHiddenPins';
import { useEditorHandlers } from './useEditorHandlers';
import { ReplaceImageModal, type ReplaceImageModalRef } from './ReplaceImageModal';
import { AppHeader } from './AppHeader';
import { ExportModal } from './ExportModal';
import { EditorTabs } from './EditorTabs';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { PaletteContext } from '../palette/PaletteContext';
import { FilterContext } from '../filters/FilterContext';
import { EditorContext } from './EditorContext';
import { CanvasContext } from '../canvas/CanvasContext';
import { ToolContext } from '../canvas/ToolContext';
import { SelectionPopoverProvider } from '../palette/SelectionPopoverContext';
import { usePaletteContextValue } from './usePaletteContextValue';
import { useFilterContextValue } from './useFilterContextValue';
import { useCanvasContextValue } from './useCanvasContextValue';
import { useEditorContextValue } from './useEditorContextValue';
import type { ToolId } from '../../tools';
import type { SamplingLevels } from '../filters/FilterContext';
import type { ProjectState } from '../../types';

interface AppProps {
  initialState: ProjectState;
  isLoading?: boolean;
  onSave: (state: ProjectState) => void | Promise<void>;
  onNewImageFile?: (file: File) => void;
}

export default function Editor({ initialState, isLoading, onSave, onNewImageFile }: AppProps) {
  const history = useHistory(initialState);
  const { status: saveStatus, save } = useSaveStatus(onSave);
  const onStateChange = useCallback(
    (s: ProjectState) => { history.push(s); save(s); },
    [history.push, save]
  );
  const project = useProjectState({ initialState, onSave: onStateChange });
  const filteredCanvasRef = useRef<HTMLCanvasElement>(null);
  const indexedCanvasRef = useRef<HTMLCanvasElement>(null);
  const pipeline = useCanvasPipeline(filteredCanvasRef, indexedCanvasRef);
  const viewport = useViewportTransform();
  const replaceRef = useRef<ReplaceImageModalRef>(null);
  const [samplingColorId, setSamplingColorId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolId>('select');
  const [samplingRadius, setSamplingRadius] = useState(30);
  const [hoveredColorId, setHoveredColorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('filters');
  const [samplingLevels, setSamplingLevels] = useState<SamplingLevels | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const hiddenPins = useHiddenPins();

  const imageHandlers = useImageHandlers({
    state: project.state, pipeline,
    setImage: project.setImage, updateColor: project.updateColor,
    setPalette: project.updateDerivedPalette, addSampledColor: project.addSampledColor,
    removeColor: project.removeColor, updateFilter: project.updateFilter,
    samplingColorId, setSamplingColorId, samplingLevels, setSamplingLevels,
    resetTransform: viewport.resetTransform,
  });

  const { handleUndo, handleRedo } = useUndoRedo({
    historyUndo: history.undo, historyRedo: history.redo,
    restoreState: project.restoreState, save,
  });

  const editorHandlers = useEditorHandlers({
    state: project.state, activeTool, samplingColorId,
    handleAddColorAtPosition: imageHandlers.handleAddColorAtPosition,
    handleSample: imageHandlers.handleSample,
    handleDeleteColor: imageHandlers.handleDeleteColor,
    handleImageLoadBitmap: imageHandlers.handleImageLoadBitmap,
    setActiveTool, setActiveTab, replaceRef, onNewImageFile,
  });

  useEditorHotkeys({
    onUndo: handleUndo, onRedo: handleRedo,
    onAddFilter: project.addFilter, onAddColor: editorHandlers.handleEnterAddColorMode,
    onClearSelection: () => editorHandlers.setSelectedColorIds(new Set()),
    onDeleteSelectedColor: editorHandlers.handleDeleteSelectedColors,
    onPasteFile: editorHandlers.handlePasteFile, setActiveTool,
    onToggleSelectTool: editorHandlers.handleToggleSelectTool,
    onToggleMarqueeTool: editorHandlers.handleToggleMarqueeTool,
  });

  const paletteValue = usePaletteContextValue({
    project, imageHandlers, editorHandlers,
    samplingColorId, activeTool, setActiveTool, setSamplingColorId, setSamplingLevels,
  });
  const filterValue = useFilterContextValue({
    project, imageHandlers, samplingLevels, setSamplingColorId, setSamplingLevels,
  });
  const canvasValue = useCanvasContextValue({
    project, viewport, filteredCanvasRef, indexedCanvasRef,
    activeTool, samplingColorId, samplingLevels, showLabels, setShowLabels,
  });
  const editorValue = useEditorContextValue({
    project, editorHandlers, hiddenPins: hiddenPins, saveStatus,
    canUndo: history.canUndo, canRedo: history.canRedo, isLoading: !!isLoading,
    hoveredColorId, setHoveredColorId, activeTab, setActiveTab,
    setExportModalOpen, replaceRef, handleUndo, handleRedo,
  });

  return (
    <ToolContext.Provider value={{ activeTool, setActiveTool, samplingRadius, setSamplingRadius }}>
      <CanvasContext.Provider value={canvasValue}>
        <EditorContext.Provider value={editorValue}>
          <PaletteContext.Provider value={paletteValue}>
            <SelectionPopoverProvider>
              <FilterContext.Provider value={filterValue}>
                <AppShell header={{ height: 68 }} padding={0}>
                  <ErrorBoundary label="Header" compact>
                    <AppHeader />
                  </ErrorBoundary>
                  <AppShell.Main
                    onClick={() => editorHandlers.handleSelectColor(null)}
                    style={{
                      background: 'var(--mantine-color-dark-9)',
                      paddingTop: 'calc(var(--app-shell-header-height) + 4px)',
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
            </SelectionPopoverProvider>
          </PaletteContext.Provider>
        </EditorContext.Provider>
      </CanvasContext.Provider>
    </ToolContext.Provider>
  );
}
