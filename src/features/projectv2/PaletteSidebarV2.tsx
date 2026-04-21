import { Stack, Text, Box, ActionIcon, Tooltip } from '@mantine/core';
import { useState, useCallback } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Trash2 } from 'lucide-react';
import { PaletteSidebarHeader } from '../palette/PaletteSidebar/PaletteSidebarHeader';
import { SortableColorPinCard, type Group } from './ColorPinCard';
import { useImpastoColorPins } from '../../engine/colorPins/useImpastoColorPins';
import { useImpastoColorPinActions } from '../../engine/colorPins/useImpastoColorPinActions';
import { orderedPinIdsByColorSimilarity } from '../../engine/colorPins/orderedPinIdsByColorSimilarity';
import { useImpastoSelection } from '../../engine/hooks/useImpastoSelection';
import { useImpastoEngine } from '../../engine/core/ImpastoEngineContext';
import { colorPinEntry } from '../../engine/infra/selectionEntry';

export function PaletteSidebarV2() {
  const pins = useImpastoColorPins();
  const { removePin, reorderPinsTo } = useImpastoColorPinActions();
  const selection = useImpastoSelection();
  const engine = useImpastoEngine();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [groups, setGroups] = useState<Group[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  /** Pin list order is owned by the engine (indexed palette slots + persistence). */
  const orderedIds = pins.map((p) => p.id);

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) {
        return;
      }
      const from = orderedIds.indexOf(String(active.id));
      const to = orderedIds.indexOf(String(over.id));
      if (from < 0 || to < 0) {
        return;
      }
      reorderPinsTo(arrayMove(orderedIds, from, to));
    },
    [orderedIds, reorderPinsTo],
  );

  const handleSortBySimilarity = useCallback(() => {
    const next = orderedPinIdsByColorSimilarity(pins, groups, assignments);
    reorderPinsTo(next);
  }, [pins, groups, assignments, reorderPinsTo]);

  const handleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.metaKey || e.shiftKey) {
      const current = selection.filter(s => s.kind === 'colorPin');
      const exists = current.some(s => s.id === id);
      engine.selection.set(exists ? current.filter(s => s.id !== id) : [...current, colorPinEntry(id)]);
    } else {
      engine.selection.set([colorPinEntry(id)]);
    }
  }, [engine, selection]);

  const handleSetGroup = useCallback((pinId: string, groupId: string | undefined) => {
    setAssignments(prev => {
      const next = { ...prev };
      if (groupId === undefined) delete next[pinId];
      else next[pinId] = groupId;
      return next;
    });
  }, []);

  const handleDeleteGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setAssignments(prev => {
      const next = { ...prev };
      for (const key of Object.keys(next)) { if (next[key] === groupId) delete next[key]; }
      return next;
    });
  }, []);

  const selectedPinIds = new Set(selection.filter(s => s.kind === 'colorPin').map(s => s.id));
  const orderedPins = orderedIds.map(id => pins.find(p => p.id === id)).filter((p): p is typeof pins[number] => p !== undefined);

  const isUngroupedPin = (p: (typeof pins)[number]) => {
    const gid = assignments[p.id];
    if (gid === undefined) {
      return true;
    }
    return !groups.some((g) => g.id === gid);
  };

  const renderPin = (pin: typeof pins[number]) => (
    <SortableColorPinCard
      key={pin.id}
      pin={pin}
      isSelected={selectedPinIds.has(pin.id)}
      groups={groups}
      groupId={assignments[pin.id]}
      onSelect={(e) => handleSelect(pin.id, e)}
      onDelete={() => removePin(pin.id)}
      onSetGroup={(gid) => handleSetGroup(pin.id, gid)}
    />
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
        <Stack gap="xs" p="xs" onClick={() => engine.selection.clear()}>
          <PaletteSidebarHeader
            onAddColor={() => {}}
            onAddGroup={() => setGroups(prev => [...prev, { id: crypto.randomUUID(), name: `Group ${prev.length + 1}` }])}
            onSort={handleSortBySimilarity}
          />

          {groups.map(group => (
            <Stack key={group.id} gap={4}>
              <Box style={{ display: 'flex', alignItems: 'center' }}>
                <Text size="xs" c="dimmed" fw={500} style={{ flex: 1 }}>{group.name}</Text>
                <Tooltip label="Delete group">
                  <ActionIcon size="xs" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}>
                    <Trash2 size={11} />
                  </ActionIcon>
                </Tooltip>
              </Box>
              <Stack gap={4}>{orderedPins.filter(p => assignments[p.id] === group.id).map(renderPin)}</Stack>
            </Stack>
          ))}

          {groups.length > 0 && orderedPins.some(isUngroupedPin) && (
            <Text size="xs" c="dimmed" fw={500}>Ungrouped</Text>
          )}

          <Stack gap={4}>{orderedPins.filter(isUngroupedPin).map(renderPin)}</Stack>
        </Stack>
      </SortableContext>
    </DndContext>
  );
}
