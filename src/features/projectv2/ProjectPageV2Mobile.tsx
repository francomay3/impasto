import { useState } from 'react';
import { Box, Progress, Text } from '@mantine/core';
import { MobileViewportToggleV2 } from './MobileViewportToggleV2';
import { MobileBottomSheetV2, PEEK_PX } from './MobileBottomSheetV2';
import { ViewportWrapper } from '../../engine/viewport/ViewportWrapper';

interface Props {
  projectName: string;
  isLoading: boolean;
  /** Thin indeterminate-style bar while Firestore DTO is applied but the image is still loading. */
  showStructuralHydrationBar?: boolean;
}

type ViewMode = 'filtered' | 'indexed';

const labelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  pointerEvents: 'none',
  userSelect: 'none',
};

export function ProjectPageV2Mobile({
  projectName: _projectName,
  isLoading,
  showStructuralHydrationBar = false,
}: Props) {
  const [view, setView] = useState<ViewMode>('filtered');

  return (
    // Flex column: viewport area grows, spacer row reserves room for the sheet peek.
    // The sheet renders via vaul's portal over that spacer, so they never overlap.
    <Box style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {showStructuralHydrationBar ? (
        <Box
          style={{
            position: 'fixed',
            insetInline: 0,
            top: 0,
            zIndex: 101,
            pointerEvents: 'none',
          }}
        >
          <Progress value={100} animated size="xs" radius={0} />
        </Box>
      ) : null}

      {/* Viewport: block pointers until imageReady (sheet is portaled — see MobileBottomSheetV2). */}
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          background: 'var(--mantine-color-dark-9)',
          cursor: 'grab',
          pointerEvents: isLoading ? 'none' : 'auto',
        }}
      >
        <ViewportWrapper surface={view} style={{ position: 'absolute', inset: 0 }} />
        <Text style={labelStyle} size="xs" c="dimmed">
          {view === 'filtered' ? 'Filtered' : 'Indexed colors'}
        </Text>
        <MobileViewportToggleV2
          view={view}
          onToggle={() => setView((v) => (v === 'filtered' ? 'indexed' : 'filtered'))}
        />
      </Box>

      {/* Spacer that matches the sheet's peek height — keeps viewport area clear */}
      <Box style={{ height: PEEK_PX, flexShrink: 0 }} />

      <MobileBottomSheetV2 interactionBlocked={isLoading} />
    </Box>
  );
}
