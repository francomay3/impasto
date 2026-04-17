import { Box, useMantineTheme } from '@mantine/core';
import { useLayoutEffect, useState, type CSSProperties } from 'react';
import { throttle } from '../infra/throttle';
import { INPUT_THROTTLE_MS } from '../core/engineConstants';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import { useImpastoMarqueeDraft } from '../hooks/useImpastoMarqueeDraft';
import { useImpastoViewportTransform } from '../hooks/useImpastoViewportTransform';
import { useViewportSurface } from '../viewport/ViewportSurfaceContext';
import { normalizeImageRect } from '../infra/imageRect';
import { imageRectToCanvasCssRect } from './marqueeOverlayLayout';

const shellStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 0,
};

export function MarqueeOverlay() {
  const surface = useViewportSurface();
  const engine = useImpastoEngine();
  const draft = useImpastoMarqueeDraft();
  const transform = useImpastoViewportTransform();
  const theme = useMantineTheme();
  const [, bumpResize] = useState(0);

  const canvas = engine.viewports[surface].canvas;

  useLayoutEffect(() => {
    const throttledBump = throttle(() => bumpResize((n) => n + 1), INPUT_THROTTLE_MS);
    const ro = new ResizeObserver(throttledBump);
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      throttledBump.cancel();
    };
  }, [canvas]);

  if (!draft || draft.surface !== surface) {
    return <div style={shellStyle} data-testid="marquee-overlay" />;
  }

  const rect = normalizeImageRect(draft.start, draft.current);
  const css = imageRectToCanvasCssRect(rect, transform, canvas);
  if (!css || (css.width === 0 && css.height === 0)) {
    return <div style={shellStyle} data-testid="marquee-overlay" />;
  }

  const c = theme.colors.blue[5];

  return (
    <div style={shellStyle} data-testid="marquee-overlay">
      <Box
        style={{
          position: 'absolute',
          left: css.left,
          top: css.top,
          width: Math.max(css.width, 1),
          height: Math.max(css.height, 1),
          border: `1px dashed ${c}`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.35) inset, 0 0 6px rgba(0,0,0,0.2)`,
          background: `${c}14`,
          borderRadius: 2,
        }}
      />
    </div>
  );
}
