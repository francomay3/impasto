import { useRef, useEffect } from 'react';
import { useHotkeys } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { HOTKEYS } from '../../hotkeys';
import type { FilterType } from '../../types';
import { useContextMenuStore } from '../../shared/contextMenuStore';
import { buildFilterMenuItems } from '../filters/FilterPanel/filterMenuData';
import type { InteractionAPI } from '../canvas/useInteraction';

interface Params {
  onUndo: () => void;
  onRedo: () => void;
  onAddFilter: (type: FilterType) => void;
  onAddColor: () => void;
  onClearSelection: () => void;
  onDeleteSelectedColor: () => void;
  onPasteFile: (file: File) => void;
  onToggleSelectTool: () => void;
  onToggleMarqueeTool: () => void;
  interaction: Pick<InteractionAPI, 'isSampling' | 'cancel'>;
}

export function useEditorHotkeys({
  onUndo,
  onRedo,
  onAddFilter,
  onAddColor,
  onClearSelection,
  onDeleteSelectedColor,
  onPasteFile,
  onToggleSelectTool,
  onToggleMarqueeTool,
  interaction,
}: Params) {
  const mousePos = useRef({ x: 0, y: 0 });
  const openMenu = useContextMenuStore(s => s.open);

  useEffect(() => {
    const track = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', track);
    return () => window.removeEventListener('mousemove', track);
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return;
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith('image/')
      );
      if (!item) return;
      const file = item.getAsFile();
      if (!file) return;
      onPasteFile(file);
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [onPasteFile]);

  // Escape must use a capture-phase listener because some React components call
  // e.stopPropagation() (which in React 18 also calls nativeEvent.stopPropagation()),
  // preventing the event from reaching document.documentElement where useHotkeys listens.
  const escapeRef = useRef({ onClearSelection, cancel: interaction.cancel });
  useEffect(() => { escapeRef.current = { onClearSelection, cancel: interaction.cancel }; });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) return;
      escapeRef.current.onClearSelection();
      escapeRef.current.cancel();
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, []);

  useHotkeys([
    [HOTKEYS.SAVE, () => notifications.show({ message: 'Project saved', color: 'blue' })],
    [HOTKEYS.UNDO, onUndo],
    [HOTKEYS.REDO, onRedo],
    [HOTKEYS.REDO_ALT, onRedo],
    [HOTKEYS.ADD_FILTER, () => openMenu({ ...mousePos.current, items: buildFilterMenuItems(onAddFilter) })],
    [HOTKEYS.ADD_COLOR, onAddColor],
    [HOTKEYS.DELETE_COLOR, onDeleteSelectedColor],
    [HOTKEYS.TOOL_EYEDROPPER, onAddColor],
    [HOTKEYS.TOOL_SELECT, onToggleSelectTool],
    [HOTKEYS.TOOL_MARQUEE, onToggleMarqueeTool],
  ]);
}
