import { Loader, Tooltip } from '@mantine/core';
import { AlertCircle } from 'lucide-react';
import { useImpastoViewportPipelineState } from '../hooks/useImpastoViewportPipelineState';
import { viewportPipelineCornerUi } from './viewportPipelineCornerUi';

const cornerShell = {
  position: 'absolute' as const,
  top: 6,
  right: 6,
  zIndex: 2,
  pointerEvents: 'none' as const,
  lineHeight: 0,
};

/**
 * Fixed host-corner readout for async filter + index workers on the filtered viewport. Stays screen-anchored
 * in the wrapper (siblings of the canvas), so it does not pan/zoom with the bitmap.
 */
export function ViewportPipelineStatusCorner() {
  const pipeline = useImpastoViewportPipelineState();
  const ui = viewportPipelineCornerUi(pipeline);

  if (!ui.visible) {
    return null;
  }

  const inner =
    ui.variant === 'loading' ? (
      <Loader size={14} type="oval" />
    ) : (
      <AlertCircle size={15} strokeWidth={2.2} color="var(--mantine-color-red-6)" aria-hidden />
    );

  return (
    <div style={cornerShell} data-testid="viewport-pipeline-status-corner">
      <Tooltip label={ui.label} position="left" withArrow openDelay={400} multiline maw={280}>
        <span style={{ display: 'inline-flex', pointerEvents: 'auto', cursor: 'default' }}>{inner}</span>
      </Tooltip>
    </div>
  );
}
