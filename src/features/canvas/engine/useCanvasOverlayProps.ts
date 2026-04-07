import { useState, useRef, useCallback, useEffect, useSyncExternalStore } from 'react';
import type { RefObject, MouseEvent as ReactMouseEvent } from 'react';
import type { CanvasEngine } from './CanvasEngine';
import { useEditorStore } from '../../editor/editorStore';
import { useCanvasContext } from '../CanvasContext';
import { usePaletteContext } from '../../palette/PaletteContext';
import { useColorContextMenu } from '../../palette/useColorContextMenu';
import { useSelectionContextMenu } from '../../palette/useSelectionContextMenu';
import { findPinAt } from './hitTest';
import type { EditPin, SamplePinsOverlayProps, MarqueeOverlayProps, SamplerStateProps } from './overlayProps.types';

export function useCanvasOverlayProps(
  engine: CanvasEngine,
  canvasRef: RefObject<HTMLCanvasElement | null>,
): {
  pins: SamplePinsOverlayProps;
  marquee: MarqueeOverlayProps;
  sampler: SamplerStateProps;
  editPin: EditPin | null;
  clearEditPin: () => void;
} {
  const { sourceImage } = useCanvasContext();
  const { palette, groups, onPinMoveEnd } = usePaletteContext();
  const selectedIds = useEditorStore((s) => s.selectedColorIds);
  const hoveredId = useEditorStore((s) => s.hoveredColorId);
  const hiddenPinIds = useEditorStore((s) => s.hiddenPinIds);
  const selectColor = useEditorStore((s) => s.selectColor);
  const toggleColorSelection = useEditorStore((s) => s.toggleColorSelection);
  const setHoveredColorId = useEditorStore((s) => s.setHoveredColorId);
  const openColorMenu = useColorContextMenu();
  const openSelectionMenu = useSelectionContextMenu();

  const snap = useSyncExternalStore(engine.subscribe.bind(engine), () => engine.getSnapshot());
  const [editPin, setEditPin] = useState<EditPin | null>(null);
  const hoveredPinRef = useRef<string | null>(null);
  const hasDraggedRef = useRef(false);
  const pinActuallyDraggedRef = useRef(false);
  const wrappedOnPinMoveEnd = useCallback(
    (...args: Parameters<typeof onPinMoveEnd>) => { pinActuallyDraggedRef.current = true; onPinMoveEnd(...args); }, [onPinMoveEnd],
  );

  useEffect(() => { engine.setSourceData(palette, sourceImage); }, [engine, palette, sourceImage]);
  useEffect(() => { engine.setOnPinMoveEnd(wrappedOnPinMoveEnd); }, [engine, wrappedOnPinMoveEnd]);
  useEffect(() => { if (snap.drag.type === 'marquee') hasDraggedRef.current = true; }, [snap.drag]);

  const getRect = useCallback(() => canvasRef.current?.getBoundingClientRect() ?? null, [canvasRef]);

  const imgWidth = sourceImage?.width ?? 0;
  const imgHeight = sourceImage?.height ?? 0;
  const pins = palette.filter((c) => c.sample && !hiddenPinIds.has(c.id));

  const onPinMouseDown = useCallback(
    (e: ReactMouseEvent, colorId: string) => {
      const rect = getRect();
      if (rect) engine.handlePinMouseDown(colorId, e.nativeEvent, rect as DOMRect);
    },
    [engine, getRect],
  );

  const onPinClick = useCallback(
    (e: ReactMouseEvent, colorId: string) => {
      e.stopPropagation();
      if (e.metaKey || e.shiftKey) toggleColorSelection(colorId);
      else selectColor(colorId);
    },
    [selectColor, toggleColorSelection],
  );

  const onPinContextMenu = useCallback(
    (e: ReactMouseEvent, colorId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = { x: e.clientX, y: e.clientY };
      if (selectedIds.size > 1 && selectedIds.has(colorId)) openSelectionMenu(pos);
      else openColorMenu(colorId, pos, { onEditStart: () => setEditPin({ colorId, position: pos }) });
    },
    [openColorMenu, openSelectionMenu, selectedIds],
  );

  const onMarqueeMouseDown = useCallback((e: ReactMouseEvent) => {
    const rect = getRect();
    if (!rect) return;
    if (engine.getToolState().activeTool === 'select' && e.button === 0) {
      const pinId = findPinAt(e.clientX, e.clientY, pins, rect as DOMRect, imgWidth, imgHeight);
      if (pinId) { e.stopPropagation(); engine.handlePinMouseDown(pinId, e.nativeEvent, rect as DOMRect); return; }
    }
    engine.handleMouseDown(e.nativeEvent, rect as DOMRect);
  }, [engine, getRect, pins, imgWidth, imgHeight]);

  const onMarqueeClick = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation();
      if (hasDraggedRef.current) { hasDraggedRef.current = false; return; }
      if (pinActuallyDraggedRef.current) { pinActuallyDraggedRef.current = false; return; }
      const rect = getRect();
      const pinId = rect ? findPinAt(e.clientX, e.clientY, pins, rect as DOMRect, imgWidth, imgHeight) : null;
      if (pinId) { if (e.metaKey || e.shiftKey) toggleColorSelection(pinId); else selectColor(pinId); }
      else selectColor(null);
    },
    [getRect, pins, imgWidth, imgHeight, selectColor, toggleColorSelection],
  );

  const onMarqueeMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      const rect = getRect();
      const pinId = rect ? findPinAt(e.clientX, e.clientY, pins, rect as DOMRect, imgWidth, imgHeight) : null;
      if (pinId === hoveredPinRef.current) return;
      hoveredPinRef.current = pinId;
      setHoveredColorId(pinId);
    },
    [getRect, pins, imgWidth, imgHeight, setHoveredColorId],
  );

  const onMarqueeContextMenu = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();
      const pos = { x: e.clientX, y: e.clientY };
      const rect = getRect();
      const pinId = rect ? findPinAt(e.clientX, e.clientY, pins, rect as DOMRect, imgWidth, imgHeight) : null;
      if (!pinId) return;
      e.stopPropagation();
      if (selectedIds.size > 1 && selectedIds.has(pinId)) openSelectionMenu(pos);
      else openColorMenu(pinId, pos, { onEditStart: () => setEditPin({ colorId: pinId, position: pos }) });
    },
    [getRect, pins, imgWidth, imgHeight, selectedIds, openSelectionMenu, openColorMenu],
  );

  return {
    pins: {
      pins, groups, selectedIds, hoveredId,
      pinDrag: snap.drag.type === 'pin' ? snap.drag : null,
      isSampling: engine.getToolState().isSampling,
      viewportScale: snap.viewport.scale,
      imgWidth, imgHeight,
      onPinMouseDown, onPinClick,
      onPinMouseEnter: (id: string) => setHoveredColorId(id),
      onPinMouseLeave: () => setHoveredColorId(null),
      onContextMenu: onPinContextMenu,
    },
    marquee: {
      activeTool: engine.getToolState().activeTool,
      isHoveringPin: !!hoveredId,
      marqueeDrag: snap.drag.type === 'marquee' ? snap.drag : null,
      onMouseDown: onMarqueeMouseDown,
      onClick: onMarqueeClick,
      onMouseMove: onMarqueeMouseMove,
      onMouseLeave: () => setHoveredColorId(null),
      onContextMenu: onMarqueeContextMenu,
    },
    sampler: {
      radius: engine.getToolState().samplingRadius,
      setRadius: (r: number) => engine.setSamplingRadius(r),
      viewportScale: snap.viewport.scale,
    },
    editPin,
    clearEditPin: () => setEditPin(null),
  };
}
