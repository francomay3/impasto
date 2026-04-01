import { useCallback, useMemo, useRef, useState } from 'react';
import { AppShell, Center, Loader } from '@mantine/core';
import { useProjectState } from './useProjectState';
import { useHistory } from './useHistory';
import { useSaveStatus } from './useSaveStatus';
import { useToolState } from '../canvas/engine/useToolState';
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
import type { ProjectState } from '../../types';

interface AppProps {
  initialState: ProjectState;
  isLoading?: boolean;
  onSave: (state: ProjectState) => void | Promise<void>;
  onNewImageFile?: (file: File) => void;
  onThumbnailColors?: (colors: string[]) => void;
}

export default function Editor({
  initialState,
  isLoading,
  onSave,
  onNewImageFile,
  onThumbnailColors,
}: AppProps) {
  const filteredCanvasRef = useRef<HTMLCanvasElement>(null);
  const [engine] = useState(() => new CanvasEngine(filteredCanvasRef));
  const history = useHistory(initialState);
  const { status: saveStatus, save } = useSaveStatus(onSave);
  const onStateChange = useCallback(
    (s: ProjectState) => { history.push(s); save(s); },
    [history, save]
  );
  const project = useProjectState({ initialState, onSave: onStateChange });
  const indexedCanvasRef = useRef<HTMLCanvasElement>(null);
  const interaction = useToolState(engine);
  const replaceRef = useRef<ReplaceImageModalRef>(null);
  const [activeTab, setActiveTab] = useState('filters');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const selectColor = useEditorStore((s) => s.selectColor);

  const { imageHandlers, editorHandlers, handleUndo, handleRedo } = useEditorActions({
    project, interaction, engine, history, save,
    onThumbnailColors, onNewImageFile, setActiveTab, replaceRef,
  });

  const paletteValue = usePaletteContextValue({ project, imageHandlers, editorHandlers, interaction });
  const filterValue = useFilterContextValue({ project, imageHandlers, interaction });
  const onToggleLabels = useCallback(() => setShowLabels((v) => !v), []);
  const canvasValue = useMemo(
    () => ({ sourceImage: project.state.sourceImage, filteredCanvasRef, indexedCanvasRef, showLabels, onToggleLabels }),
    [project.state.sourceImage, filteredCanvasRef, indexedCanvasRef, showLabels, onToggleLabels]
  );
  const editorValue = useEditorContextValue({
    project,
    editorHandlers,
    saveStatus,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    isLoading: !!isLoading,
    activeTab,
    setActiveTab,
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
