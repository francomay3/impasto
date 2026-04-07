import { useCallback, useMemo, type RefObject } from 'react';
import type { useProjectState } from './useProjectState';
import type { useEditorHandlers } from './useEditorHandlers';
import type { SaveStatus } from './useSaveStatus';
import type { ReplaceImageModalRef } from './ReplaceImageModal';
import type { FilterToolId } from '../../tools';

type Project = ReturnType<typeof useProjectState>;
type EditorHandlers = ReturnType<typeof useEditorHandlers>;

interface Options {
  project: Project;
  hasImage: boolean;
  editorHandlers: EditorHandlers;
  saveStatus: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeFilterTool: FilterToolId;
  onSetActiveFilterTool: (tool: FilterToolId) => void;
  setExportModalOpen: (v: boolean) => void;
  replaceRef: RefObject<ReplaceImageModalRef | null>;
  handleUndo: () => void;
  handleRedo: () => void;
}

export function useEditorContextValue({
  project,
  hasImage,
  editorHandlers,
  saveStatus,
  canUndo,
  canRedo,
  isLoading,
  activeTab,
  setActiveTab,
  activeFilterTool,
  onSetActiveFilterTool,
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
      hasImage,
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
      activeFilterTool,
      onSetActiveFilterTool,
    }),
    [
      project.state.name,
      hasImage,
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
      activeFilterTool,
      onSetActiveFilterTool,
    ]
  );
}
