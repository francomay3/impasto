import { useState, useCallback } from 'react';
import {
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import { SmartMouseSensor } from '../../../utils/dndSensor';
import { arrayMove } from '@dnd-kit/sortable';
import type { Color, ColorGroup } from '../../../types';
import { movePaletteItemBefore, appendPaletteItemToGroup, reorderWithinGroup } from './paletteDndTransforms';

interface Options {
  palette: Color[];
  groups: ColorGroup[];
  onReorderGroups: (groups: ColorGroup[]) => void;
  onReorderPalette: (palette: Color[]) => void;
}

interface Return {
  sensors: ReturnType<typeof useSensors>;
  collisionDetection: CollisionDetection;
  displayPalette: Color[];
  draggingType: 'group' | 'color' | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
}

export function usePaletteDnd({ palette, groups, onReorderGroups, onReorderPalette }: Options): Return {
  const [draggingType, setDraggingType] = useState<'group' | 'color' | null>(null);
  const [dragPalette, setDragPalette] = useState<Color[] | null>(null);
  const sensors = useSensors(useSensor(SmartMouseSensor));

  const displayPalette = dragPalette ?? palette;

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const type = args.active.data.current?.type;
    if (type === 'group') {
      return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter(c => c.data.current?.type === 'group') });
    }
    return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter(c => c.data.current?.type !== 'group') });
  }, []);

  function handleDragStart(event: DragStartEvent) {
    setDraggingType(event.active.data.current?.type ?? null);
    if (event.active.data.current?.type === 'color') {
      setDragPalette([...palette]);
    }
  }

  // Live cross-group repositioning: fires on every hover while dragging
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== 'color') return;
    if (over.data.current?.type !== 'color') return;

    setDragPalette(current => movePaletteItemBefore(current!, String(active.id), String(over.id)));
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingType(null);
    const { active, over } = event;
    const p = dragPalette ?? palette;

    if (!over || active.id === over.id) {
      if (dragPalette) onReorderPalette(dragPalette);
      setDragPalette(null);
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'group' && overData?.type === 'group') {
      const oldIdx = groups.findIndex(g => g.id === active.id);
      const newIdx = groups.findIndex(g => g.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) onReorderGroups(arrayMove(groups, oldIdx, newIdx));
      return;
    }

    if (activeData?.type === 'color') {
      // Dropped on empty group drop zone — append to that group
      if (overData?.type === 'groupDrop') {
        const targetGroupId = overData.groupId as string | undefined;
        const next = appendPaletteItemToGroup(p, String(active.id), targetGroupId);
        if (next !== p) onReorderPalette(next);
        else if (dragPalette) onReorderPalette(dragPalette);
        setDragPalette(null);
        return;
      }

      // Dropped on a color in the same group — finalize sort position
      const reordered = reorderWithinGroup(p, String(active.id), String(over.id));
      if (reordered !== p) {
        onReorderPalette(reordered);
        setDragPalette(null);
        return;
      }

      if (dragPalette) onReorderPalette(dragPalette);
      setDragPalette(null);
    }
  }

  function handleDragCancel() {
    setDraggingType(null);
    setDragPalette(null);
  }

  return { sensors, collisionDetection, displayPalette, draggingType, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel };
}
