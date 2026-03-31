import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { hexToRgb, rgbToHex, rgbToLab, labMidpoint } from '../../utils/colorUtils';
import { findBestMatchPosition } from '../../utils/labSearch';
import { useCanvasContext } from '../canvas/CanvasContext';
import { usePaletteContext } from './PaletteContext';

const DELTA_E_WARN_THRESHOLD = 15;

export function useMergePins() {
  const { filteredCanvasRef } = useCanvasContext();
  const { palette, onAddColorAtPosition, onDeleteColor } = usePaletteContext();

  return useCallback(
    (id1: string, id2: string) => {
      const a = palette.find((c) => c.id === id1);
      const b = palette.find((c) => c.id === id2);
      if (!a?.sample || !b?.sample) return;

      const canvas = filteredCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const targetLab = labMidpoint(rgbToLab(...hexToRgb(a.hex)), rgbToLab(...hexToRgb(b.hex)));
      const { x, y, deltaE } = findBestMatchPosition(imageData, targetLab);

      if (deltaE > DELTA_E_WARN_THRESHOLD) {
        notifications.show({
          message: `No close match found in the image (ΔE ${deltaE.toFixed(0)}). Pin placed at the nearest available color.`,
          color: 'yellow',
          autoClose: 6000,
        });
      }

      const i = (y * imageData.width + x) * 4;
      const hex = rgbToHex(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);

      onDeleteColor(id1);
      onDeleteColor(id2);
      onAddColorAtPosition({ x, y, radius: 1 }, hex);
    },
    [filteredCanvasRef, palette, onAddColorAtPosition, onDeleteColor]
  );
}
