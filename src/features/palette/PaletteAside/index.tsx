import { Tabs, Tooltip } from '@mantine/core';
import { Palette, FlaskConical } from 'lucide-react';
import { PaletteSidebar } from '../PaletteSidebar';
import { PigmentsPanel } from './PigmentsPanel';

const iconTabStyle: React.CSSProperties = {
  width: 32,
  height: 36,
  padding: 0,
  justifyContent: 'center',
};

const panelStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  scrollbarWidth: 'none',
  minWidth: 0,
};

export function PaletteAside() {
  return (
    <Tabs
      defaultValue="palette"
      orientation="vertical"
      style={{ height: '100%', display: 'flex' }}
    >
      <Tabs.List style={{ width: 32, flexShrink: 0 }}>
        <Tooltip label="Palette" position="left" withArrow>
          <Tabs.Tab value="palette" style={iconTabStyle}>
            <Palette size={15} />
          </Tabs.Tab>
        </Tooltip>
        <Tooltip label="Pigments" position="left" withArrow>
          <Tabs.Tab value="pigments" style={iconTabStyle}>
            <FlaskConical size={15} />
          </Tabs.Tab>
        </Tooltip>
      </Tabs.List>

      <Tabs.Panel value="palette" style={panelStyle}>
        <PaletteSidebar />
      </Tabs.Panel>
      <Tabs.Panel value="pigments" style={panelStyle}>
        <PigmentsPanel />
      </Tabs.Panel>
    </Tabs>
  );
}
