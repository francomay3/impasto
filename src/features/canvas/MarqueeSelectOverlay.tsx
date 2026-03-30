import { useRef, useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { Box } from '@mantine/core';
import { PinEditPopover } from '../palette/PinEditPopover';
import { useCanvasContext } from './CanvasContext';
import { usePaletteContext } from '../palette/PaletteContext';
import { useEditorContext } from '../editor/EditorContext';
import { useToolContext } from './ToolContext';
import { useCanvasMeasure } from './useCanvasMeasure';
import { useColorContextMenu } from '../palette/useColorContextMenu';
import { useSelectionContextMenu } from '../palette/useSelectionContextMenu';

const HIT_R = 11;

interface DragRect { startX: number; startY: number; endX: number; endY: number }

interface Props {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export function MarqueeSelectOverlay({ canvasRef }: Props) {
  const { activeTool } = useToolContext();
  const { sourceImage, viewportTransform, onMouseDown: panMouseDown } = useCanvasContext();
  const { palette } = usePaletteContext();
  const { selectedColorIds, onSelectColor, onToggleColorSelection, onSetSelection, onHoverColor, hiddenPinIds } = useEditorContext();
  const { measure } = useCanvasMeasure(canvasRef);
  const openColorMenu = useColorContextMenu();
  const openSelectionMenu = useSelectionContextMenu();
  const selectedColorIdsRef = useRef(selectedColorIds);
  const hasDraggedRef = useRef(false);
  const [drag, setDrag] = useState<DragRect | null>(null);
  const [editPin, setEditPin] = useState<{ colorId: string; position: { x: number; y: number } } | null>(null);

  useEffect(() => { selectedColorIdsRef.current = selectedColorIds; }, [selectedColorIds]);
  useEffect(() => { measure(); }, [viewportTransform, measure]);

  const visiblePins = palette.filter(c => c.sample && !hiddenPinIds.has(c.id));
  const visiblePinsRef = useRef(visiblePins);
  visiblePinsRef.current = visiblePins;
  const sourceImageRef = useRef(sourceImage);
  sourceImageRef.current = sourceImage;

  // Returns canvas bounding rect in client (absolute) coordinates
  const getClientCanvasRect = useCallback(() => {
    return canvasRef.current?.getBoundingClientRect() ?? null;
  }, [canvasRef]);

  // Stable across renders — reads latest data from refs
  const findPinAt = useCallback((cx: number, cy: number): string | null => {
    if (!sourceImageRef.current) return null;
    const cr = getClientCanvasRect();
    if (!cr) return null;
    const { width, height } = sourceImageRef.current;
    for (const c of visiblePinsRef.current) {
      if (!c.sample) continue;
      const sx = cr.left + (c.sample.x / width) * cr.width;
      const sy = cr.top + (c.sample.y / height) * cr.height;
      if (Math.hypot(cx - sx, cy - sy) <= HIT_R) return c.id;
    }
    return null;
  }, [getClientCanvasRect]);

  const getPinsInRect = useCallback((rect: DragRect): Set<string> => {
    if (!sourceImage) return new Set();
    const cr = getClientCanvasRect();
    if (!cr) return new Set();
    const toImg = (sx: number, sy: number) => ({
      x: (sx - cr.left) / cr.width * sourceImage.width,
      y: (sy - cr.top) / cr.height * sourceImage.height,
    });
    const { x: x1, y: y1 } = toImg(Math.min(rect.startX, rect.endX), Math.min(rect.startY, rect.endY));
    const { x: x2, y: y2 } = toImg(Math.max(rect.startX, rect.endX), Math.max(rect.startY, rect.endY));
    return new Set(visiblePins.filter(c => c.sample && c.sample.x >= x1 && c.sample.x <= x2 && c.sample.y >= y1 && c.sample.y <= y2).map(c => c.id));
  }, [getClientCanvasRect, sourceImage, visiblePins]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    if (activeTool === 'select') {
      panMouseDown(e);
      return;
    }

    // marquee mode: draw selection rect
    const startX = e.clientX;
    const startY = e.clientY;
    hasDraggedRef.current = false;

    let rafPending = false;
    let latestEv: MouseEvent | null = null;

    const handleMove = (ev: MouseEvent) => {
      if (!hasDraggedRef.current && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 4) hasDraggedRef.current = true;
      if (!hasDraggedRef.current) return;
      latestEv = ev;
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        if (!latestEv) return;
        setDrag({ startX, startY, endX: latestEv.clientX, endY: latestEv.clientY });
        latestEv = null;
      });
    };

    const handleUp = (ev: MouseEvent) => {
      latestEv = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      setDrag(null);
      if (!hasDraggedRef.current) return;
      const rect = { startX, startY, endX: ev.clientX, endY: ev.clientY };
      const ids = getPinsInRect(rect);
      const additive = ev.metaKey || ev.shiftKey;
      onSetSelection(additive ? new Set([...selectedColorIdsRef.current, ...ids]) : ids);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [activeTool, panMouseDown, getPinsInRect, onSetSelection]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDraggedRef.current) { hasDraggedRef.current = false; return; }
    const pinId = findPinAt(e.clientX, e.clientY);
    if (pinId) {
      if (e.metaKey || e.shiftKey) onToggleColorSelection(pinId);
      else onSelectColor(pinId);
    } else {
      onSelectColor(null);
    }
  }, [findPinAt, onSelectColor, onToggleColorSelection]);

  const hoveredPinRef = useRef<string | null>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pinId = findPinAt(e.clientX, e.clientY);
    if (pinId === hoveredPinRef.current) return;
    hoveredPinRef.current = pinId;
    onHoverColor(pinId);
  }, [findPinAt, onHoverColor]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const pos = { x: e.clientX, y: e.clientY };
    const pinId = findPinAt(e.clientX, e.clientY);
    if (pinId && selectedColorIds.size > 1 && selectedColorIds.has(pinId)) {
      e.stopPropagation();
      openSelectionMenu(pos);
    } else if (pinId) {
      e.stopPropagation();
      openColorMenu(pinId, pos, { onEditStart: () => setEditPin({ colorId: pinId, position: pos }) });
    }
  }, [findPinAt, selectedColorIds, openSelectionMenu, openColorMenu]);

  if ((activeTool !== 'select' && activeTool !== 'marquee') || !sourceImage) return null;

  const rectStyle = drag ? {
    position: 'fixed' as const,
    left: Math.min(drag.startX, drag.endX),
    top: Math.min(drag.startY, drag.endY),
    width: Math.abs(drag.endX - drag.startX),
    height: Math.abs(drag.endY - drag.startY),
    border: '1px solid var(--mantine-color-primary-4)',
    background: 'color-mix(in srgb, var(--mantine-color-primary-4) 15%, transparent)',
    pointerEvents: 'none' as const,
    zIndex: 6,
  } : null;

  return (
    <>
      <Box
        style={{ position: 'absolute', inset: 0, cursor: activeTool === 'marquee' ? 'crosshair' : 'default', zIndex: 5, pointerEvents: 'all' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => onHoverColor(null)}
        onContextMenu={handleContextMenu}
      />
      {rectStyle && <Box style={rectStyle} />}
      {editPin && <PinEditPopover colorId={editPin.colorId} position={editPin.position} onClose={() => setEditPin(null)} />}
    </>
  );
}
