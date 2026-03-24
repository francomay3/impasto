import { useState, useCallback } from 'react';
import {
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Color, ColorGroup } from '../../types';

interface Options {
  palette: Color[];
  groups: ColorGroup[];
  onReorderGroups: (groups: ColorGroup[]) => void;
  onSetColorGroup: (colorId: string, groupId: string | undefined) => void;
  onReorderPalette: (palette: Color[]) => void;
}

interface Return {
  sensors: ReturnType<typeof useSensors>;
  collisionDetection: CollisionDetection;
  draggingType: 'group' | 'color' | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

export function usePaletteDnd({ palette, groups, onReorderGroups, onSetColorGroup, onReorderPalette }: Options): Return {
  const [draggingType, setDraggingType] = useState<'group' | 'color' | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const type = args.active.data.current?.type;
    if (type === 'group') {
      return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter(c => c.data.current?.type === 'group') });
    }
    return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter(c => c.data.current?.type !== 'group') });
  }, []);

  function handleDragStart(event: DragStartEvent) {
    setDraggingType(event.active.data.current?.type ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingType(null);
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'group' && overData?.type === 'group') {
      const oldIdx = groups.findIndex(g => g.id === active.id);
      const newIdx = groups.findIndex(g => g.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) onReorderGroups(arrayMove(groups, oldIdx, newIdx));
      return;
    }

    if (activeData?.type === 'color' && overData?.type === 'groupDrop') {
      const targetGroupId = overData.groupId as string | undefined;
      const activeColor = palette.find(c => c.id === active.id);
      if (activeColor && activeColor.groupId !== targetGroupId) onSetColorGroup(String(active.id), targetGroupId);
      return;
    }

    if (activeData?.type === 'color' && overData?.type === 'color') {
      const activeColor = palette.find(c => c.id === active.id);
      const overColor = palette.find(c => c.id === over.id);
      if (!activeColor || !overColor) return;

      if (activeColor.groupId === overColor.groupId) {
        const gid = activeColor.groupId;
        const groupColors = palette.filter(c => c.groupId === gid);
        const oldIdx = groupColors.findIndex(c => c.id === active.id);
        const newIdx = groupColors.findIndex(c => c.id === over.id);
        if (oldIdx === newIdx) return;
        const reordered = arrayMove(groupColors, oldIdx, newIdx);
        const slots = palette.map((c, i) => c.groupId === gid ? i : -1).filter(i => i !== -1);
        const newPalette = [...palette];
        slots.forEach((pi, pos) => { newPalette[pi] = reordered[pos]; });
        onReorderPalette(newPalette);
      } else {
        onSetColorGroup(String(active.id), overColor.groupId);
      }
    }
  }

  return { sensors, collisionDetection, draggingType, handleDragStart, handleDragEnd };
}
