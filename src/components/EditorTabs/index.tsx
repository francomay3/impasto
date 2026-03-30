import { Box, Stack, Tabs, Text, Title } from '@mantine/core';
import { Layers, Palette, BarChart2, Grid, Scaling, Brush, ImageUp } from 'lucide-react';
import { ToolRail } from '../ToolRail';
import type { ToolRailItem } from '../ToolRail';
import { TOOLS } from '../../tools';
import { useToolContext } from '../../context/ToolContext';
import { FilterPanel } from '../../features/filters/FilterPanel';
import { PaletteSidebar } from '../../features/palette/PaletteSidebar';
import { ErrorBoundary } from '../ErrorBoundary';
import { FiltersTabContent } from './FiltersTabContent';
import { PaletteTabContent } from './PaletteTabContent';
import { ImageUploader } from '../ImageUploader';
import { useEditorContext } from '../../context/EditorContext';
import { useCanvasContext } from '../../context/CanvasContext';
import { ContextualToolbar } from '../ContextualToolbar';

const asideStyle: React.CSSProperties = {
  width: 260,
  flexShrink: 0,
  borderLeft: '1px solid var(--mantine-color-dark-6)',
  background: 'var(--mantine-color-dark-8)',
  overflowY: 'auto',
  scrollbarWidth: 'none',
};

function TabLayout({ children, aside, rail, toolbar }: {
  children?: React.ReactNode;
  aside: React.ReactNode;
  rail?: React.ReactNode;
  toolbar?: React.ReactNode;
}) {
  return (
    <Box style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {rail}
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {toolbar}
        <Box style={{ flex: 1, overflow: 'hidden' }}>{children}</Box>
      </Box>
      <Box style={asideStyle} className="hide-scrollbar">{aside}</Box>
    </Box>
  );
}


interface Props {
  height?: string | number;
}

export function EditorTabs({ height = '100%' }: Props) {
  const { activeTab, onSetActiveTab, onFileSelected } = useEditorContext();
  const { sourceImage } = useCanvasContext();
  const { activeTool, setActiveTool } = useToolContext();

  const toolRailItems: ToolRailItem[] = TOOLS.map(tool => ({
    icon: <tool.icon size={16} />,
    label: `${tool.label} (${tool.shortcut})`,
    testId: `tool-${tool.id}`,
    active: activeTool === tool.id,
    onClick: () => setActiveTool(tool.id),
  }));

  if (!sourceImage) {
    return (
      <Box style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Stack align="center" gap="xl" style={{ width: '100%', maxWidth: 560 }}>
          <Stack align="center" gap="xs">
            <ImageUp size={48} color="var(--mantine-color-dark-3)" />
            <Title order={3} c="dimmed" fw={400}>Start by loading an image</Title>
            <Text size="sm" c="dimmed">Drop a photo here or click to browse</Text>
          </Stack>
          <ImageUploader
            onFileSelected={onFileSelected}
            style={{ width: '100%', padding: 64, borderRadius: 12 }}
          />
        </Stack>
      </Box>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onChange={(v) => v && onSetActiveTab(v)}
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
        <TabLayout
          toolbar={<ContextualToolbar tab="filters" />}
          aside={
            <ErrorBoundary label="Filter panel" compact>
              <FilterPanel />
            </ErrorBoundary>
          }
        >
          <ErrorBoundary label="Filters view" compact>
            <FiltersTabContent />
          </ErrorBoundary>
        </TabLayout>
      </Tabs.Panel>

      <Tabs.Panel value="palette" style={{ flex: 1, overflow: 'hidden' }}>
        <TabLayout
          toolbar={<ContextualToolbar tab="palette" />}
          rail={<ToolRail items={toolRailItems} />}
          aside={
            <ErrorBoundary label="Palette sidebar" compact>
              <PaletteSidebar />
            </ErrorBoundary>
          }
        >
          <ErrorBoundary label="Palette view" compact>
            <PaletteTabContent />
          </ErrorBoundary>
        </TabLayout>
      </Tabs.Panel>
    </Tabs>
  );
}
