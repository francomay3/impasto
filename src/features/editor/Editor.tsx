import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AppShell, Center, Loader } from '@mantine/core';
import type { FilterToolId } from '../../tools';
import { useProjectState } from './useProjectState';
import { useHistory } from './useHistory';
import { useSaveStatus } from './useSaveStatus';
import type { InteractionAPI } from '../canvas/engine/toolStateManager';
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
import { useEditorContextValue } from './useEditorContextValue';
import { useEditorStore } from './editorStore';
import { useEditorActions } from './useEditorActions';
import { CanvasEngine } from '../canvas/engine/CanvasEngine';
import { EngineProvider } from '../canvas/engine/EngineContext';
import { ReplaceImageModal, type ReplaceImageModalRef } from './ReplaceImageModal';
import type { ProjectState, RawImage } from '../../types';

interface AppProps {
  initialState: ProjectState;
  initialImage?: RawImage | null;
  isLoading?: boolean;
  onSave: (state: ProjectState) => void | Promise<void>;
  onNewImageFile?: (file: File) => void;
  onThumbnailColors?: (colors: string[]) => void;
}

export default function Editor({
  initialState,
  initialImage,
  isLoading,
  onSave,
  onNewImageFile,
  onThumbnailColors,
}: AppProps) {
  const filteredCanvasRef = useRef<HTMLCanvasElement>(null);
  const [engine] = useState(() => new CanvasEngine(filteredCanvasRef));
  const sourceImageRef = useRef<RawImage | null>(initialImage ?? null);
  const history = useHistory(initialState, initialImage ?? null);
  const { status: saveStatus, save } = useSaveStatus(onSave);
  const onStateChange = useCallback(
    (s: ProjectState) => { history.push(s, sourceImageRef.current); save(s); },
    [history, save]
  );
  const project = useProjectState({ initialState, onSave: onStateChange });
  const indexedCanvasRef = useRef<HTMLCanvasElement>(null);
  const toolSnap = useSyncExternalStore(engine.subscribe.bind(engine), engine.getToolState.bind(engine));
  const interaction: InteractionAPI = {
    ...toolSnap,
    selectTool: engine.selectTool.bind(engine),
    activateEyedropper: engine.activateEyedropper.bind(engine),
    toggleMarquee: engine.toggleMarquee.bind(engine),
    startSamplingColor: engine.startSamplingColor.bind(engine),
    startSamplingLevels: engine.startSamplingLevels.bind(engine),
    completeSample: engine.completeSample.bind(engine),
    cancel: engine.cancel.bind(engine),
    setSamplingRadius: engine.setSamplingRadius.bind(engine),
    setSelectionMode: engine.setSelectionMode.bind(engine),
    setActiveTool: engine.setActiveTool.bind(engine),
  };
  const replaceRef = useRef<ReplaceImageModalRef>(null);
  const [activeTab, setActiveTab] = useState('filters');
  const [activeFilterTool, setActiveFilterTool] = useState<FilterToolId>('pan');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const selectColor = useEditorStore((s) => s.selectColor);

  const { imageHandlers, editorHandlers, handleUndo, handleRedo, sourceImage } = useEditorActions({
    project, interaction, engine, history, save,
    initialImage, sourceImageRef,
    onThumbnailColors, onNewImageFile, setActiveTab,
    onResetFilterTool: () => setActiveFilterTool('pan'),
    replaceRef,
  });

  const paletteValue = usePaletteContextValue({ project, imageHandlers, editorHandlers, interaction });
  const filterValue = useFilterContextValue({ project, imageHandlers, interaction });
  const onToggleLabels = useCallback(() => setShowLabels((v) => !v), []);
  const canvasValue = useMemo(
    () => ({ sourceImage, filteredCanvasRef, indexedCanvasRef, showLabels, onToggleLabels }),
    [sourceImage, filteredCanvasRef, indexedCanvasRef, showLabels, onToggleLabels]
  );
  const editorValue = useEditorContextValue({
    project,
    hasImage: !!sourceImage,
    editorHandlers,
    saveStatus,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    isLoading: !!isLoading,
    activeTab,
    setActiveTab,
    activeFilterTool,
    onSetActiveFilterTool: setActiveFilterTool,
    setExportModalOpen,
    replaceRef,
    handleUndo,
    handleRedo,
  });

  return (
    <EngineProvider value={engine}>
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
    </EngineProvider>
  );
}
