import { Box, Tabs } from '@mantine/core';
import { Layers, Palette, BarChart2, Grid, Scaling, Brush } from 'lucide-react';
import { FilterPanel } from '../FilterPanel';
import { PaletteSidebar } from '../PaletteSidebar';
import { ErrorBoundary } from '../ErrorBoundary';
import { FiltersTabContent } from './FiltersTabContent';
import { PaletteTabContent } from './PaletteTabContent';

const asideStyle: React.CSSProperties = {
  width: 260,
  flexShrink: 0,
  borderLeft: '1px solid var(--mantine-color-dark-6)',
  background: 'var(--mantine-color-dark-8)',
  overflowY: 'auto',
  scrollbarWidth: 'none',
};

function TabLayout({ children, aside }: { children?: React.ReactNode; aside: React.ReactNode }) {
  return (
    <Box style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Box style={{ flex: 1, overflow: 'hidden' }}>{children}</Box>
      <Box style={asideStyle} className="hide-scrollbar">{aside}</Box>
    </Box>
  );
}

interface Props {
  height?: string | number;
}

export function EditorTabs({ height = '100%' }: Props) {
  return (
    <Tabs
      defaultValue="filters"
      keepMounted
      variant="outline"
      style={{ height, display: 'flex', flexDirection: 'column' }}
    >
      <Tabs.List>
        <Tabs.Tab value="filters" leftSection={<Layers size={12} />}>Filters</Tabs.Tab>
        <Tabs.Tab value="palette" leftSection={<Palette size={12} />}>Palette</Tabs.Tab>
        <Tabs.Tab value="values" leftSection={<BarChart2 size={12} />} disabled>Values</Tabs.Tab>
        <Tabs.Tab value="composition" leftSection={<Grid size={12} />} disabled>Composition</Tabs.Tab>
        <Tabs.Tab value="color-study" leftSection={<Scaling size={12} />} disabled>Color Study</Tabs.Tab>
        <Tabs.Tab value="paint" leftSection={<Brush size={12} />} disabled>Paint</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="filters" style={{ flex: 1, overflow: 'hidden' }}>
        <TabLayout aside={
          <ErrorBoundary label="Filter panel" compact>
            <FilterPanel collapsed={false} onToggleCollapse={() => {}} />
          </ErrorBoundary>
        }>
          <ErrorBoundary label="Filters view" compact>
            <FiltersTabContent />
          </ErrorBoundary>
        </TabLayout>
      </Tabs.Panel>

      <Tabs.Panel value="palette" style={{ flex: 1, overflow: 'hidden' }}>
        <TabLayout aside={
          <ErrorBoundary label="Palette sidebar" compact>
            <PaletteSidebar />
          </ErrorBoundary>
        }>
          <ErrorBoundary label="Palette view" compact>
            <PaletteTabContent />
          </ErrorBoundary>
        </TabLayout>
      </Tabs.Panel>
    </Tabs>
  );
}
