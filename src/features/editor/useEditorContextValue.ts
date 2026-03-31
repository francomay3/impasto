import { useCallback, useMemo, type RefObject } from 'react';
import type { useProjectState } from './useProjectState';
import type { useEditorHandlers } from './useEditorHandlers';
import type { SaveStatus } from './useSaveStatus';
import type { ReplaceImageModalRef } from './ReplaceImageModal';

type Project = ReturnType<typeof useProjectState>;
type EditorHandlers = ReturnType<typeof useEditorHandlers>;

interface Options {
  project: Project;
  editorHandlers: EditorHandlers;
  saveStatus: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setExportModalOpen: (v: boolean) => void;
  replaceRef: RefObject<ReplaceImageModalRef | null>;
  handleUndo: () => void;
  handleRedo: () => void;
}

export function useEditorContextValue({
  project,
  editorHandlers,
  saveStatus,
  canUndo,
  canRedo,
  isLoading,
  activeTab,
  setActiveTab,
  setExportModalOpen,
  replaceRef,
  handleUndo,
  handleRedo,
}: Options) {
  const onExportClick = useCallback(() => setExportModalOpen(true), [setExportModalOpen]);
  const onReplaceImage = useCallback(() => replaceRef.current?.open(), [replaceRef]);

  return useMemo(
    () => ({
      projectName: project.state.name,
      hasImage: !!project.state.sourceImage,
      saveStatus,
      canUndo,
      canRedo,
      isLoading,
      onExportClick,
      onReplaceImage,
      onFileSelected: editorHandlers.handleFileSelected,
      onRename: project.renameName,
      onUndo: handleUndo,
      onRedo: handleRedo,
      activeTab,
      onSetActiveTab: setActiveTab,
    }),
    [
      project.state.name,
      project.state.sourceImage,
      saveStatus,
      canUndo,
      canRedo,
      isLoading,
      onExportClick,
      onReplaceImage,
      editorHandlers.handleFileSelected,
      project.renameName,
      handleUndo,
      handleRedo,
      activeTab,
      setActiveTab,
    ]
  );
}
