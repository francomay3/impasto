import { useRef, useEffect } from 'react';
import { useHotkeys } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { HOTKEYS } from '../hotkeys';
import type { FilterType } from '../types';
import { useContextMenu } from '../context/ContextMenuContext';
import { buildFilterMenuItems } from '../components/FilterPanel/filterMenuData';

interface Params {
  onUndo: () => void;
  onRedo: () => void;
  onAddFilter: (type: FilterType) => void;
  onAddColor: () => void;
}

export function useEditorHotkeys({ onUndo, onRedo, onAddFilter, onAddColor }: Params) {
  const mousePos = useRef({ x: 0, y: 0 });
  const { open: openMenu } = useContextMenu();

  useEffect(() => {
    const track = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', track);
    return () => window.removeEventListener('mousemove', track);
  }, []);

  useHotkeys([
    [HOTKEYS.SAVE,       () => notifications.show({ message: 'Project saved', color: 'blue' })],
    [HOTKEYS.UNDO,       onUndo],
    [HOTKEYS.REDO,       onRedo],
    [HOTKEYS.REDO_ALT,   onRedo],
    [HOTKEYS.ADD_FILTER, () => openMenu({ ...mousePos.current, items: buildFilterMenuItems(onAddFilter) })],
    [HOTKEYS.ADD_COLOR,  onAddColor],
  ]);
}
