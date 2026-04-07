import { useCallback, useMemo } from 'react';
import type { useProjectState } from './useProjectState';
import type { useImageHandlers } from './useImageHandlers';
import type { useEditorHandlers } from './useEditorHandlers';
import type { InteractionAPI } from '../canvas/engine/toolStateManager';
import { useEditorStore } from './editorStore';

type Project = ReturnType<typeof useProjectState>;
type ImageHandlers = ReturnType<typeof useImageHandlers>;
type EditorHandlers = ReturnType<typeof useEditorHandlers>;

interface Options {
  project: Project;
  imageHandlers: ImageHandlers;
  editorHandlers: EditorHandlers;
  interaction: InteractionAPI;
}

export function usePaletteContextValue({
  project,
  imageHandlers,
  editorHandlers,
  interaction,
}: Options) {
  const { updateColor } = project;
  const { cancel } = interaction;
  const activePaletteTool = useEditorStore((s) => s.activePaletteTool);

  const onRenameColor = useCallback(
    (id: string, name: string) => updateColor(id, { name }),
    [updateColor]
  );

  const onRemoveSamplePin = useCallback(
    (id: string) => updateColor(id, { sample: undefined }),
    [updateColor]
  );

  return useMemo(
    () => ({
      palette: project.state.palette,
      groups: project.state.groups ?? [],
      isAddingColor: activePaletteTool === 'eyedropper',
      onAddNewColor: editorHandlers.handleAddNewColor,
      onCancelAddingColor: cancel,
      onRenameColor,
      onAddColor: editorHandlers.handleEnterAddColorMode,
      onAddColorAtPosition: imageHandlers.handleAddColorAtPosition,
      onDeleteColor: imageHandlers.handleDeleteColor,
      onPinMoveEnd: imageHandlers.handlePinMoveEnd,
      onRemoveSamplePin,
      onAddGroup: project.addGroup,
      onRemoveGroup: project.removeGroup,
      onRenameGroup: project.renameGroup,
      onSetColorGroup: project.setColorGroup,
      onReorderPalette: project.setPalette,
      onReorderGroups: project.reorderGroups,
    }),
    [
      project.state.palette,
      project.state.groups,
      activePaletteTool,
      editorHandlers.handleAddNewColor,
      cancel,
      onRenameColor,
      editorHandlers.handleEnterAddColorMode,
      imageHandlers.handleAddColorAtPosition,
      imageHandlers.handleDeleteColor,
      imageHandlers.handlePinMoveEnd,
      onRemoveSamplePin,
      project.addGroup,
      project.removeGroup,
      project.renameGroup,
      project.setColorGroup,
      project.setPalette,
      project.reorderGroups,
    ]
  );
}
