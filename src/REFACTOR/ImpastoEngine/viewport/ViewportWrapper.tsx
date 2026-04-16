import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { Box, Text, type BoxProps } from '@mantine/core';
import { ColorPinsOverlay } from '../colorPins/ColorPinsOverlay';
import { MarqueeOverlay } from '../selection/MarqueeOverlay';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import { ViewportSurfaceProvider } from './ViewportSurfaceContext';

type ViewportWrapperProps = {
  surface: 'source' | 'filtered' | 'indexed';
  hostStyle?: CSSProperties;
  /**
   * Interactive HTML overlay for engine color pins (same camera as the canvas; pin widgets stay sharp).
   * Default: on for `filtered` and `indexed` (sample-color tool adds pins on both).
   */
  showColorPinsOverlay?: boolean;
  /** Marquee rubber band in image space; default on filtered/indexed. */
  showMarqueeOverlay?: boolean;
} & BoxProps;

/**
 * Mounts one viewport canvas under a host Box. Must render under {@link ImpastoEngineProvider}.
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

  return (
    <ViewportSurfaceProvider value={surface}>
      <Box
        ref={hostRef}
        {...boxProps}
        style={{ position: 'relative', overflow: 'hidden', ...boxProps.style }}
      >
        {marqueeOverlay && <MarqueeOverlay />}
        {pinsOverlay && <ColorPinsOverlay />}
        <Text style={{ position: 'absolute', top: '0px', left: '4px', zIndex: 2 }}>{surface}</Text>
      </Box>
    </ViewportSurfaceProvider>
  );
}
