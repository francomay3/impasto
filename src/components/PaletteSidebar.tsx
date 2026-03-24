import { useRef, useState, useCallback } from 'react';
import { Stack, Box, Text, Badge, ActionIcon, Tooltip, NumberInput, Divider, TextInput, Menu } from '@mantine/core';
import { Crosshair, X, GripVertical, ChevronDown, ChevronRight, FolderPlus, Folder } from 'lucide-react';
import { AddItemButton } from './AddItemButton';
import useConfirmDialog from './useConfirmDialog';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Color, ColorGroup } from '../types';

// ─── Color item ───────────────────────────────────────────────────────────────

interface ColorItemSharedProps {
  groups: ColorGroup[];
  samplingColorId: string | null;
  onStartSampling: (id: string) => void;
  onColorChange: (id: string, hex: string) => void;
  onRenameColor: (id: string, name: string) => void;
  onDeleteColor: (id: string) => void;
  onSetGroup: (colorId: string, groupId: string | undefined) => void;
  onAddGroup: (id: string, name: string) => void;
  onToggleHighlight: (id: string) => void;
  colorInputRef: (el: HTMLInputElement | null) => void;
}

function ColorItem({
  color, groups, samplingColorId, dragHandleProps, showDragHandle,
  onStartSampling, onColorChange, onRenameColor, onDeleteColor, onSetGroup, onAddGroup, onToggleHighlight, colorInputRef,
}: { color: Color; dragHandleProps?: React.HTMLAttributes<HTMLElement>; showDragHandle?: boolean } & ColorItemSharedProps) {
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const handleNameEditStart = () => {
    setEditNameValue(color.name || color.hex.toUpperCase());
    setEditingName(true);
  };

  const handleNameSubmit = () => {
    const trimmed = editNameValue.trim();
    onRenameColor(color.id, trimmed === color.hex.toUpperCase() ? '' : trimmed);
    setEditingName(false);
  };

  return (
    <Box style={{
      border: samplingColorId === color.id ? '2px solid #4fc3f7' : '1px solid #333',
      borderRadius: 6, padding: 8, background: '#1e1e1e',
    }}>
      <Stack gap={4}>
        {/* Row 1: grip + swatch + name */}
        <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {showDragHandle && (
            <Box
              {...dragHandleProps}
              style={{ cursor: 'grab', color: '#555', display: 'flex', alignItems: 'center', flexShrink: 0, touchAction: 'none' }}
            >
              <GripVertical size={14} />
            </Box>
          )}
          <Box style={{ position: 'relative', width: 26, height: 26, flexShrink: 0 }}>
            <Box style={{ width: 26, height: 26, borderRadius: 4, background: color.hex, border: '1px solid #444', cursor: 'pointer' }} />
            <input
              type="color"
              value={color.hex}
              onChange={(e) => onColorChange(color.id, e.target.value)}
              ref={colorInputRef}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
          </Box>
          {editingName ? (
            <TextInput
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.currentTarget.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); if (e.key === 'Escape') setEditingName(false); }}
              size="xs"
              autoFocus
              style={{ flex: 1 }}
            />
          ) : (
            <Text
              size="xs"
              ff={color.name ? undefined : 'monospace'}
              onClick={handleNameEditStart}
              style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'text' }}
            >
              {color.name || color.hex.toUpperCase()}
            </Text>
          )}
        </Box>

        {/* Row 2: metadata (left) + actions (right), indented past grip+swatch */}
        <Box style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 46 }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
            {color.name && <Text ff="monospace" c="dimmed" style={{ fontSize: 10 }}>{color.hex.toUpperCase()}</Text>}
            {color.ratio > 0 && <Badge size="xs" variant="outline" color="gray">{color.ratio}%</Badge>}
          </Box>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <Menu shadow="md" width={160} position="bottom-end">
              <Menu.Target>
                <Tooltip label="Move to group">
                  <ActionIcon size="sm" variant="subtle" color={color.groupId ? 'blue' : 'gray'}>
                    <Folder size={13} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Assign group</Menu.Label>
                <Menu.Item leftSection={<X size={12} />} onClick={() => onSetGroup(color.id, undefined)} style={{ fontWeight: !color.groupId ? 600 : 400 }}>
                  No group
                </Menu.Item>
                {groups.map(g => (
                  <Menu.Item key={g.id} leftSection={<Folder size={12} />} onClick={() => onSetGroup(color.id, g.id)} style={{ fontWeight: color.groupId === g.id ? 600 : 400 }}>
                    {g.name}
                  </Menu.Item>
                ))}
                <Menu.Divider />
                <Menu.Item leftSection={<Plus size={12} />} onClick={() => {
                  const newId = crypto.randomUUID();
                  onAddGroup(newId, `Group ${groups.length + 1}`);
                  onSetGroup(color.id, newId);
                }}>
                  New group
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Tooltip label={color.highlighted ? 'Remove highlight' : 'Highlight in indexed view'}>
              <ActionIcon
                size="sm"
                variant={color.highlighted ? 'filled' : 'subtle'}
                color={color.highlighted ? 'green' : 'gray'}
                onClick={() => onToggleHighlight(color.id)}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color.highlighted ? '#fff' : 'currentColor' }} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Sample from image">
              <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => onStartSampling(color.id)}>
                <Crosshair size={13} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete color">
              <ActionIcon size="sm" variant="subtle" color="red" onClick={() => onDeleteColor(color.id)}>
                <X size={13} />
              </ActionIcon>
            </Tooltip>
          </Box>
        </Box>

        {color.mixRecipe && (
          <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>{color.mixRecipe}</Text>
        )}
      </Stack>
    </Box>
  );
}

function SortableColorItem({ color, showDragHandle, ...rest }: { color: Color; showDragHandle?: boolean } & ColorItemSharedProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: color.id,
    data: { type: 'color' },
  });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      <ColorItem color={color} dragHandleProps={{ ...attributes, ...listeners }} showDragHandle={showDragHandle} {...rest} />
    </div>
  );
}

// ─── Group drop zone (bottom of each group, receives dragged colors) ──────────

function GroupDropZone({ groupId, isDraggingColor }: { groupId: string | undefined; isDraggingColor: boolean }) {
  const id = groupId !== undefined ? `zone-${groupId}` : 'zone-ungrouped';
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'groupDrop', groupId } });

  if (!isDraggingColor) return null;

  return (
    <div
      ref={setNodeRef}
      style={{
        height: 28,
        borderRadius: 4,
        border: `1px dashed ${isOver ? '#4fc3f7' : '#444'}`,
        background: isOver ? 'rgba(79,195,247,0.08)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        transition: 'all 0.15s',
      }}
    >
      <Text size="xs" c={isOver ? 'blue' : 'dimmed'} style={{ fontStyle: 'italic', fontSize: 11 }}>
        {isOver ? 'Release to add here' : 'Drop color here'}
      </Text>
    </div>
  );
}

// ─── Group container ──────────────────────────────────────────────────────────

interface SortableGroupProps {
  group: ColorGroup;
  children: React.ReactNode;
  collapsed: boolean;
  isDraggingColor: boolean;
  autoEdit?: boolean;
  showDragHandle?: boolean;
  colorCount: number;
  onToggleCollapse: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

function SortableGroup({ group, children, collapsed, isDraggingColor, autoEdit, showDragHandle, colorCount, onToggleCollapse, onRename, onDelete }: SortableGroupProps) {
  const [editing, setEditing] = useState(() => autoEdit ?? false);
  const [editName, setEditName] = useState(group.name);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
    data: { type: 'group' },
  });

  const { confirm: confirmDelete, confirmDialog } = useConfirmDialog({
    title: 'Delete group',
    description: `Delete "${group.name}"? Colors in this group will become ungrouped.`,
    onConfirm: onDelete,
  });

  const handleRenameSubmit = () => {
    if (editName.trim()) onRename(editName.trim());
    setEditing(false);
  };

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      {confirmDialog}
      <Box style={{ border: '1px solid #2a2a2a', borderRadius: 6, overflow: 'hidden' }}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: '#252525' }}>
          {showDragHandle && (
            <Box {...attributes} {...listeners} style={{ cursor: 'grab', color: '#555', display: 'flex', flexShrink: 0, touchAction: 'none' }}>
              <GripVertical size={13} />
            </Box>
          )}
          <Box onClick={colorCount > 0 ? onToggleCollapse : undefined} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 4, cursor: colorCount > 0 ? 'pointer' : 'default' }}>
            {colorCount > 0 && (collapsed ? <ChevronRight size={13} color="#888" /> : <ChevronDown size={13} color="#888" />)}
            {editing ? (
              <TextInput
                value={editName}
                onChange={(e) => setEditName(e.currentTarget.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setEditing(false); }}
                onFocus={(e) => e.currentTarget.select()}
                size="xs" autoFocus style={{ flex: 1 }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <Box style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <Text size="xs" fw={600} c="dimmed" onClick={(e) => { e.stopPropagation(); setEditing(true); setEditName(group.name); }} style={{ cursor: 'text' }}>{group.name}</Text>
                {colorCount === 0 && <Text size="xs" c="dimmed" style={{ fontStyle: 'italic', opacity: 0.5 }}>empty</Text>}
              </Box>
            )}
          </Box>
          {!editing && (
            <>
              <Tooltip label="Delete group">
                <ActionIcon size="xs" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); void (colorCount > 0 ? confirmDelete() : onDelete()); }}>
                  <X size={11} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
        </Box>
        {(colorCount === 0 || collapsed) && isDraggingColor && (
          <Box px={6} pb={6}>
            <GroupDropZone groupId={group.id} isDraggingColor={isDraggingColor} />
          </Box>
        )}
        {colorCount > 0 && !collapsed && (
          <Box p={6}>
            {children}
            <GroupDropZone groupId={group.id} isDraggingColor={isDraggingColor} />
          </Box>
        )}
      </Box>
    </div>
  );
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

interface Props {
  palette: Color[];
  groups: ColorGroup[];
  blur: number;
  samplingColorId: string | null;
  onBlurChange: (v: number) => void;
  onStartSampling: (id: string) => void;
  onColorChange: (id: string, hex: string) => void;
  onRenameColor: (id: string, name: string) => void;
  onAddColor: () => void;
  onDeleteColor: (id: string) => void;
  onToggleHighlight: (id: string) => void;
  onAddGroup: (id: string, name: string) => void;
  onRemoveGroup: (id: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onSetColorGroup: (colorId: string, groupId: string | undefined) => void;
  onReorderPalette: (palette: Color[]) => void;
  onReorderGroups: (groups: ColorGroup[]) => void;
}

export function PaletteSidebar({
  palette, groups, blur, samplingColorId,
  onBlurChange, onStartSampling, onColorChange, onRenameColor, onAddColor, onDeleteColor,
  onToggleHighlight, onAddGroup, onRemoveGroup, onRenameGroup, onSetColorGroup, onReorderPalette, onReorderGroups,
}: Props) {
  const colorInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [draggingType, setDraggingType] = useState<'group' | 'color' | null>(null);
  const [newGroupId, setNewGroupId] = useState<string | null>(null);

  const handleAddGroup = useCallback((id: string, name: string) => {
    onAddGroup(id, name);
    setNewGroupId(id);
  }, [onAddGroup]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Custom collision detection: group drags only target groups; color drags never target groups.
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const type = args.active.data.current?.type;
    if (type === 'group') {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(c => c.data.current?.type === 'group'),
      });
    }
    // color drag: exclude group sortable items so they can't accidentally catch the drop
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(c => c.data.current?.type !== 'group'),
    });
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

    // Group reordering
    if (activeData?.type === 'group' && overData?.type === 'group') {
      const oldIdx = groups.findIndex(g => g.id === active.id);
      const newIdx = groups.findIndex(g => g.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) onReorderGroups(arrayMove(groups, oldIdx, newIdx));
      return;
    }

    // Color dropped onto a group drop zone → assign to that group
    if (activeData?.type === 'color' && overData?.type === 'groupDrop') {
      const targetGroupId = overData.groupId as string | undefined;
      const activeColor = palette.find(c => c.id === active.id);
      if (activeColor && activeColor.groupId !== targetGroupId) {
        onSetColorGroup(String(active.id), targetGroupId);
      }
      return;
    }

    // Color dropped onto another color
    if (activeData?.type === 'color' && overData?.type === 'color') {
      const activeColor = palette.find(c => c.id === active.id);
      const overColor = palette.find(c => c.id === over.id);
      if (!activeColor || !overColor) return;

      if (activeColor.groupId === overColor.groupId) {
        // Same container → reorder
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
        // Different container → move color to target group
        onSetColorGroup(String(active.id), overColor.groupId);
      }
    }
  }

  const toggleCollapse = (id: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const colorRef = (id: string) => (el: HTMLInputElement | null) => {
    if (el) colorInputRefs.current.set(id, el);
    else colorInputRefs.current.delete(id);
  };

  const ungroupedColors = palette.filter(c => !c.groupId || !groups.find(g => g.id === c.groupId));
  const isDraggingColor = draggingType === 'color';

  const colorProps = (color: Color): ColorItemSharedProps => ({
    groups,
    samplingColorId,
    onStartSampling,
    onColorChange,
    onRenameColor,
    onDeleteColor,
    onSetGroup: onSetColorGroup,
    onAddGroup: handleAddGroup,
    onToggleHighlight,
    colorInputRef: colorRef(color.id),
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Stack gap="xs" p="md">
        <Text fw={600} size="sm">Pre-Indexing</Text>
        <Stack gap={2}>
          <Text size="xs" c="dimmed">Simplification blur</Text>
          <NumberInput value={blur} min={0} max={50} suffix="px" onChange={(v) => onBlurChange(Number(v))} size="xs" />
        </Stack>
        <Divider />

        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text fw={600} size="sm">Palette</Text>
          <Tooltip label="Add group">
            <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => handleAddGroup(crypto.randomUUID(), `Group ${groups.length + 1}`)}>
              <FolderPlus size={14} />
            </ActionIcon>
          </Tooltip>
        </Box>

        {/* Groups */}
        <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
          <Stack gap={6}>
            {groups.map(group => {
              const groupColors = palette.filter(c => c.groupId === group.id);
              return (
                <SortableGroup
                  key={group.id}
                  group={group}
                  collapsed={collapsedGroups.has(group.id)}
                  isDraggingColor={isDraggingColor}
                  autoEdit={group.id === newGroupId}
                  showDragHandle={groups.length > 1}
                  colorCount={groupColors.length}
                  onToggleCollapse={() => toggleCollapse(group.id)}
                  onRename={(name) => onRenameGroup(group.id, name)}
                  onDelete={() => onRemoveGroup(group.id)}
                >
                  <SortableContext items={groupColors.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <Stack gap={4}>
                      {groupColors.map(color => (
                        <SortableColorItem key={color.id} color={color} showDragHandle {...colorProps(color)} />
                      ))}
                    </Stack>
                  </SortableContext>
                </SortableGroup>
              );
            })}
          </Stack>
        </SortableContext>

        {/* Ungrouped */}
        {ungroupedColors.length > 0 && (
          <>
            {groups.length > 0 && <Text size="xs" c="dimmed" fw={500} style={{ marginTop: 4 }}>Ungrouped</Text>}
            <SortableContext items={ungroupedColors.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <Stack gap={4}>
                {ungroupedColors.map(color => (
                  <SortableColorItem key={color.id} color={color} showDragHandle {...colorProps(color)} />
                ))}
              </Stack>
            </SortableContext>
            <GroupDropZone groupId={undefined} isDraggingColor={isDraggingColor} />
          </>
        )}

        <AddItemButton label="Add Color" onClick={onAddColor} />
      </Stack>
    </DndContext>
  );
}
