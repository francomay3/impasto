import { Tabs, Tooltip } from '@mantine/core';
import { Palette, FlaskConical, SlidersHorizontal } from 'lucide-react';
import { type EditorAsidePanel, useEditorStore } from '../editor/editorStore';
import { FiltersPanel } from './FiltersPanel/FiltersPanel';
import { PaletteSidebarV2 } from './PaletteSidebarV2';
import { PigmentsPanelV2 } from './PigmentsPanelV2';

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

export function PaletteAsideV2() {
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);

  return (
    <Tabs
      value={activePanel}
      onChange={(v) => v && setActivePanel(v as EditorAsidePanel)}
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
        <Tooltip label="Filters" position="left" withArrow>
          <Tabs.Tab value="filters" style={iconTabStyle}>
            <SlidersHorizontal size={15} />
          </Tabs.Tab>
        </Tooltip>
      </Tabs.List>

      <Tabs.Panel value="palette" style={panelStyle}>
        <PaletteSidebarV2 />
      </Tabs.Panel>
      <Tabs.Panel value="pigments" style={panelStyle}>
        <PigmentsPanelV2 />
      </Tabs.Panel>
      <Tabs.Panel value="filters" style={panelStyle}>
        <FiltersPanel />
      </Tabs.Panel>
    </Tabs>
  );
}
