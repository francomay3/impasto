import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { RefObject } from 'react';
import { Box } from '@mantine/core';
import { PinEditPopover } from '../palette/PinEditPopover';
import { useCanvasContext } from './CanvasContext';
import { usePaletteContext } from '../palette/PaletteContext';
import { useEditorStore } from '../editor/editorStore';
import { useColorContextMenu } from '../palette/useColorContextMenu';
import { useSelectionContextMenu } from '../palette/useSelectionContextMenu';
import { usePinHitTest } from './usePinHitTest';
import { useMarqueeDrag } from './useMarqueeDrag';

interface Props {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export function MarqueeSelectOverlay({ canvasRef }: Props) {
  const { sourceImage, activeTool, selectionMode, onMouseDown: panMouseDown } = useCanvasContext();
  const { palette } = usePaletteContext();
  const selectedColorIds = useEditorStore(s => s.selectedColorIds);
  const hiddenPinIds = useEditorStore(s => s.hiddenPinIds);
  const selectColor = useEditorStore(s => s.selectColor);
  const toggleColorSelection = useEditorStore(s => s.toggleColorSelection);
  const setSelectedColorIds = useEditorStore(s => s.setSelectedColorIds);
  const setHoveredColorId = useEditorStore(s => s.setHoveredColorId);
  const openColorMenu = useColorContextMenu();
  const openSelectionMenu = useSelectionContextMenu();
  const [editPin, setEditPin] = useState<{ colorId: string; position: { x: number; y: number } } | null>(null);

  const selectedColorIdsRef = useRef(selectedColorIds);
  const visiblePins = useMemo(
    () => palette.filter((c) => c.sample && !hiddenPinIds.has(c.id)),
    [palette, hiddenPinIds]
  );
  const visiblePinsRef = useRef(visiblePins);
  visiblePinsRef.current = visiblePins;
  const sourceImageRef = useRef(sourceImage);
  sourceImageRef.current = sourceImage;

  useEffect(() => { selectedColorIdsRef.current = selectedColorIds; }, [selectedColorIds]);

  const { findPinAt, getPinsInRect } = usePinHitTest({
    canvasRef, sourceImageRef, visiblePinsRef, sourceImage, visiblePins,
  });

  const { drag, handleMouseDown, hasDraggedRef } = useMarqueeDrag({
    getPinsInRect,
    onSetSelection: setSelectedColorIds,
    selectedColorIdsRef,
    panMouseDown,
    isMarqueeMode: activeTool === 'marquee',
    selectionMode,
  });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasDraggedRef.current) { hasDraggedRef.current = false; return; }
      const pinId = findPinAt(e.clientX, e.clientY);
      if (pinId) {
        if (e.metaKey || e.shiftKey) toggleColorSelection(pinId);
        else selectColor(pinId);
      } else {
        selectColor(null);
      }
    },
    [findPinAt, selectColor, toggleColorSelection, hasDraggedRef]
  );

  const hoveredPinRef = useRef<string | null>(null);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pinId = findPinAt(e.clientX, e.clientY);
      if (pinId === hoveredPinRef.current) return;
      hoveredPinRef.current = pinId;
      setHoveredColorId(pinId);
    },
    [findPinAt, setHoveredColorId]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [findPinAt, selectedColorIds, openSelectionMenu, openColorMenu]
  );

  if ((activeTool !== 'select' && activeTool !== 'marquee') || !sourceImage) return null;

  const rectStyle = drag
    ? {
        position: 'fixed' as const,
        left: Math.min(drag.startX, drag.endX),
        top: Math.min(drag.startY, drag.endY),
        width: Math.abs(drag.endX - drag.startX),
        height: Math.abs(drag.endY - drag.startY),
        border: '1px solid var(--mantine-color-primary-4)',
        background: 'color-mix(in srgb, var(--mantine-color-primary-4) 15%, transparent)',
        pointerEvents: 'none' as const,
        zIndex: 6,
      }
    : null;

  return (
    <>
      <Box
        data-no-pan={activeTool === 'marquee' ? '' : undefined}
        style={{
          position: 'absolute',
          inset: 0,
          cursor: activeTool === 'marquee' ? 'crosshair' : 'default',
          zIndex: 5,
          pointerEvents: 'all',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => setHoveredColorId(null)}
        onContextMenu={handleContextMenu}
      />
      {rectStyle && createPortal(<Box style={rectStyle} />, document.body)}
      {editPin && (
        <PinEditPopover
          colorId={editPin.colorId}
          position={editPin.position}
          onClose={() => setEditPin(null)}
        />
      )}
    </>
  );
}
