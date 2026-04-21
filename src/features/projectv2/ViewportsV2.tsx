import { Box } from '@mantine/core';
import { ViewportWrapper } from '../../engine/viewport/ViewportWrapper';

const paneStyle = {
  flex: 1,
  minWidth: 0,
  height: '100%',
  background: 'var(--mantine-color-dark-9)',
} as const;

export function ViewportsV2() {
  return (
    <Box style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <ViewportWrapper surface="filtered" style={paneStyle} />
      <Box
        style={{
          width: 1,
          height: '100%',
          background: 'var(--mantine-color-dark-6)',
          flexShrink: 0,
        }}
      />
      <ViewportWrapper surface="indexed" style={paneStyle} />
    </Box>
  );
}
