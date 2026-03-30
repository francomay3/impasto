import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { Crosshair, Copy, PinOff, Trash2, Settings2 } from 'lucide-react';
import { usePaletteContext } from './PaletteContext';
import { useContextMenu } from '../../context/ContextMenuContext';

interface OpenOptions {
  onEditStart?: () => void;
}

export function useColorContextMenu() {
  const { palette, onStartSampling, onDeleteColor, onRemoveSamplePin } = usePaletteContext();
  const { open: openMenu } = useContextMenu();

  const open = useCallback(
    (colorId: string, pos: { x: number; y: number }, opts: OpenOptions = {}) => {
      const color = palette.find((c) => c.id === colorId);
      if (!color) return;

      openMenu({
        x: pos.x,
        y: pos.y,
        items: [
          {
            label: 'Resample',
            icon: <Crosshair size={14} />,
            onClick: () => onStartSampling(colorId),
          },
          ...(opts.onEditStart
            ? [{ label: 'Edit', icon: <Settings2 size={14} />, onClick: opts.onEditStart }]
            : []),
          {
            label: 'Copy hex',
            icon: <Copy size={14} />,
            onClick: () => {
              navigator.clipboard.writeText(color.hex.toLowerCase());
              notifications.show({
                message: `Copied ${color.hex.toLowerCase()}`,
                color: 'green',
                autoClose: 1500,
              });
            },
          },
          ...(color.sample
            ? [
                {
                  label: 'Remove pin',
                  icon: <PinOff size={14} />,
                  onClick: () => onRemoveSamplePin(colorId),
                },
              ]
            : []),
          { type: 'divider' as const },
          {
            label: 'Delete color',
            icon: <Trash2 size={14} />,
            onClick: () => onDeleteColor(colorId),
            color: 'red',
          },
        ],
      });
    },
    [palette, openMenu, onStartSampling, onDeleteColor, onRemoveSamplePin]
  );

  return open;
}
