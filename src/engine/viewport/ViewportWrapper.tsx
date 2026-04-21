import { useLayoutEffect, useRef } from 'react';
import { useGesture } from '@use-gesture/react';
import { Box, type BoxProps } from '@mantine/core';
import { ColorPinsOverlay } from '../colorPins/ColorPinsOverlay';
import { MarqueeOverlay } from '../selection/MarqueeOverlay';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import { ViewportSurfaceProvider } from './ViewportSurfaceContext';
import { sampleColorBrushWheelNudgeDeltaSteps } from '../input/sampleColorBrushWheelNudge';
import {
  nextTransformFromWheelDelta,
  nextTransformFromPinch,
} from '../viewports/canvas/host/viewportCanvasGestures';
import { useFitOnImageLoad } from './useFitOnImageLoad';
import { fitToContain } from './fitToContain';
import type { ViewportTransform } from './models';

type ViewportWrapperProps = {
  surface: 'source' | 'filtered' | 'indexed';
  /**
   * Interactive HTML overlay for engine color pins (same camera as the canvas; pin widgets stay sharp).
   * Default: on for `filtered` and `indexed` (sample-color tool adds pins on both).
   */
  showColorPinsOverlay?: boolean;
  /** Marquee rubber band in image space; default on filtered/indexed. */
  showMarqueeOverlay?: boolean;
} & BoxProps;

/**
 * Mounts one viewport canvas under a host Box and wires wheel/pinch zoom via use-gesture.
 * Must render under {@link ImpastoProjectProvider}.
 *
 * Zoom is handled here (not in the pointer bridge) so pinch gestures from touch devices and
 * trackpad two-finger pinch are routed through use-gesture's normalised onPinch handler, avoiding
 * the discrete-step problem of raw WheelEvent sign-only detection.
 */
export function ViewportWrapper({
  surface,
  showColorPinsOverlay,
  showMarqueeOverlay,
  ...boxProps
}: ViewportWrapperProps) {
  const engine = useImpastoEngine();
  const hostRef = useRef<HTMLDivElement>(null);
  const pinsOverlay =
    showColorPinsOverlay ?? (surface === 'filtered' || surface === 'indexed');
  const marqueeOverlay =
    showMarqueeOverlay ?? (surface === 'filtered' || surface === 'indexed');

  useFitOnImageLoad(hostRef);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const viewport = engine.viewports[surface];
    const { canvas } = viewport;
    host.insertBefore(canvas, host.firstChild);
    viewport.syncDisplayToHost();

    return () => {
      if (canvas.parentNode === host) {
        host.removeChild(canvas);
      }
    };
  }, [engine, surface]);

  // Wheel + pinch zoom — use-gesture normalises across devices and detects pinch via ctrlKey heuristic.
  // Alt/Shift + wheel adjusts sample-color brush radius (see `sampleColorBrushWheelNudgeDeltaSteps`).
  useGesture(
    {
      onWheel: ({ delta: [, dy], event }) => {
        const rect = hostRef.current?.getBoundingClientRect();
        if (!rect) return;
        const e = event as WheelEvent;
        const brushDelta = sampleColorBrushWheelNudgeDeltaSteps(e, engine.tools.getState().activeTool.id);
        if (brushDelta !== null) {
          e.preventDefault();
          engine.tools.nudgeSampleColorBrush(brushDelta);
          return;
        }
        const current = engine.viewport.physics.transform;
        engine.viewport.requestTransform(
          nextTransformFromWheelDelta(current, dy, e.clientX - rect.left, e.clientY - rect.top),
        );
      },
      onPinch: ({ offset: [scale], origin: [ox, oy], first, memo }) => {
        const rect = hostRef.current?.getBoundingClientRect();
        type PinchMemo = { startTransform: ViewportTransform; initialScale: number };
        // offset[0] accumulates across gestures and never resets to 1.0 between sessions.
        // Capture initialScale at gesture start so relativeScale is always 1.0 at first and
        // reflects only what the user did in THIS gesture.
        const pinchMemo: PinchMemo = first
          ? { startTransform: { ...engine.viewport.physics.transform }, initialScale: scale }
          : (memo as PinchMemo);
        if (!rect) return pinchMemo;
        const relativeScale = scale / pinchMemo.initialScale;
        engine.viewport.requestTransform(
          nextTransformFromPinch(pinchMemo.startTransform, relativeScale, ox - rect.left, oy - rect.top),
        );
        return pinchMemo;
      },
    },
    {
      target: hostRef,
      wheel: { eventOptions: { passive: false } },
      pinch: { eventOptions: { passive: false } },
    },
  );

  return (
    <ViewportSurfaceProvider value={surface}>
      <Box
        ref={hostRef}
        {...boxProps}
        onDoubleClick={() => {
          const image = engine.image.get();
          const host = hostRef.current;
          if (!image || !host) return;
          const { width: vpW, height: vpH } = host.getBoundingClientRect();
          if (vpW === 0 || vpH === 0) return;
          engine.viewport.requestTransform(fitToContain(image.width, image.height, vpW, vpH));
        }}
        style={{ position: 'relative', overflow: 'hidden', touchAction: 'none', ...boxProps.style }}
      >
        {marqueeOverlay && <MarqueeOverlay />}
        {pinsOverlay && <ColorPinsOverlay />}
      </Box>
    </ViewportSurfaceProvider>
  );
}
