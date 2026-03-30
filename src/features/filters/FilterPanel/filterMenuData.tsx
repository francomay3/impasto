import { SlidersHorizontal, Palette, Layers, Droplets } from 'lucide-react';
import type { FilterType } from '../../../types';
import { FILTER_LABELS } from '../../../types';
import type { ContextMenuEntry } from '../../../context/ContextMenuContext';

export const FILTER_ICONS: Record<FilterType, React.ReactNode> = {
  'brightness-contrast': <SlidersHorizontal size={14} />,
  'hue-saturation': <Palette size={14} />,
  levels: <Layers size={14} />,
  blur: <Droplets size={14} />,
};

export const FILTER_GROUPS: { label: string; filters: FilterType[] }[] = [
  { label: 'Light & Tone', filters: ['brightness-contrast', 'levels'] },
  { label: 'Color', filters: ['hue-saturation'] },
  { label: 'Effects', filters: ['blur'] },
];

export function buildFilterMenuItems(onAdd: (type: FilterType) => void): ContextMenuEntry[] {
  return FILTER_GROUPS.flatMap((group, i): ContextMenuEntry[] => [
    ...(i > 0 ? [{ type: 'divider' as const }] : []),
    { type: 'label' as const, label: group.label },
    ...group.filters.map((type) => ({
      label: FILTER_LABELS[type],
      icon: FILTER_ICONS[type],
      onClick: () => onAdd(type),
    })),
  ]);
}
