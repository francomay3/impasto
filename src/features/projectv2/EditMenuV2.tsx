import { Menu, Text } from '@mantine/core';
import { useImpastoEngine } from '../../engine/core/ImpastoEngineContext';
import { useImpastoHistoryState } from '../../engine/history/useImpastoHistoryState';
import { useImpastoPipelineFilters } from '../../engine/hooks/useImpastoPipelineFilters';
import { FILTER_GROUPS, FILTER_ICONS } from '../filters/FilterPanel/filterMenuData';
import { FILTER_LABELS, type FilterType } from '../../types';
import { useEditorStore } from '../editor/editorStore';
import { appendFilterWithType } from './addFilterAction';

export function EditMenuV2() {
  const engine = useImpastoEngine();
  const filters = useImpastoPipelineFilters();
  const { canUndo, canRedo } = useImpastoHistoryState(engine.managers.history);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);

  const addFilterFromMenu = (type: FilterType) => {
    engine.filters.setFilters(appendFilterWithType(filters, type, crypto.randomUUID()));
    setActivePanel('filters');
  };

  return (
    <>
      <Menu.Item
        disabled={!canUndo}
        onClick={() => engine.managers.history.back()}
        rightSection={<Text size="xs" c="dimmed">⌘Z</Text>}
      >
        Undo
      </Menu.Item>
      <Menu.Item
        disabled={!canRedo}
        onClick={() => engine.managers.history.forward()}
        rightSection={<Text size="xs" c="dimmed">⌘⇧Z</Text>}
      >
        Redo
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item onClick={() => void engine.viewport.fitToImage()}>Reset Transform</Menu.Item>
      <Menu.Item onClick={() => engine.colorPins.clear()}>Clear Color Pins</Menu.Item>
      <Menu.Divider />
      <Menu.Sub>
        <Menu.Sub.Target>
          <Menu.Sub.Item>Add Filter</Menu.Sub.Item>
        </Menu.Sub.Target>
        <Menu.Sub.Dropdown>
          {FILTER_GROUPS.flatMap((group, i) => [
            i > 0 && <Menu.Divider key={`div-${group.label}`} />,
            <Menu.Label key={`lbl-${group.label}`}>{group.label}</Menu.Label>,
            ...group.filters.map((type) => (
              <Menu.Item
                key={type}
                leftSection={FILTER_ICONS[type]}
                onClick={() => addFilterFromMenu(type)}
              >
                {FILTER_LABELS[type]}
              </Menu.Item>
            )),
          ])}
        </Menu.Sub.Dropdown>
      </Menu.Sub>
    </>
  );
}
