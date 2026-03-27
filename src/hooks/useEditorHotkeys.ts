import { useRef, useEffect } from 'react';
import { useHotkeys } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { HOTKEYS } from '../hotkeys';
import type { FilterType } from '../types';
import type { ToolId } from '../tools';
import { useContextMenu } from '../context/ContextMenuContext';
import { buildFilterMenuItems } from '../components/FilterPanel/filterMenuData';

interface Params {
  onUndo: () => void;
  onRedo: () => void;
  onAddFilter: (type: FilterType) => void;
  onAddColor: () => void;
  onClearSelection: () => void;
  onDeleteSelectedColor: () => void;
  onPasteFile: (file: File) => void;
  setActiveTool: (id: ToolId) => void;
  onToggleSelectTool: () => void;
  onToggleMarqueeTool: () => void;
}

export function useEditorHotkeys({ onUndo, onRedo, onAddFilter, onAddColor, onClearSelection, onDeleteSelectedColor, onPasteFile, setActiveTool, onToggleSelectTool, onToggleMarqueeTool }: Params) {
  const mousePos = useRef({ x: 0, y: 0 });
  const { open: openMenu } = useContextMenu();

  useEffect(() => {
    const track = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', track);
    return () => window.removeEventListener('mousemove', track);
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'));
      if (!item) return;
      const file = item.getAsFile();
      if (!file) return;
      onPasteFile(file);
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [onPasteFile]);

  useHotkeys([
    [HOTKEYS.SAVE,       () => notifications.show({ message: 'Project saved', color: 'blue' })],
    [HOTKEYS.UNDO,       onUndo],
    [HOTKEYS.REDO,       onRedo],
    [HOTKEYS.REDO_ALT,   onRedo],
    [HOTKEYS.CANCEL,          () => { onClearSelection(); setActiveTool('select'); }],
    [HOTKEYS.ADD_FILTER,      () => openMenu({ ...mousePos.current, items: buildFilterMenuItems(onAddFilter) })],
    [HOTKEYS.ADD_COLOR,       onAddColor],
    [HOTKEYS.DELETE_COLOR,    onDeleteSelectedColor],
    [HOTKEYS.TOOL_EYEDROPPER, onAddColor],
    [HOTKEYS.TOOL_SELECT,     onToggleSelectTool],
    [HOTKEYS.TOOL_MARQUEE,    onToggleMarqueeTool],
  ]);
}
