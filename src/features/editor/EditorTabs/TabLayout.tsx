import { Box } from '@mantine/core';

interface Props {
  children?: React.ReactNode;
  aside: React.ReactNode;
  rail?: React.ReactNode;
  toolbar?: React.ReactNode;
}

const asideStyle: React.CSSProperties = {
  width: 292,
  flexShrink: 0,
  borderLeft: '1px solid var(--mantine-color-dark-6)',
  background: 'var(--mantine-color-dark-8)',
  overflowY: 'auto',
  scrollbarWidth: 'none',
};

export function TabLayout({ children, aside, rail, toolbar }: Props) {
  return (
    <Box style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {rail}
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {toolbar}
        <Box style={{ flex: 1, overflow: 'hidden' }}>{children}</Box>
      </Box>
      <Box style={asideStyle} className="hide-scrollbar">
        {aside}
      </Box>
    </Box>
  );
}
