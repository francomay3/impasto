import { useCallback } from 'react';
import { sortByColorSimilarity } from '../../../utils/sortByColorSimilarity';
import { usePaletteContext } from '../PaletteContext';

export function useSortPalette() {
  const { palette, groups, onReorderPalette } = usePaletteContext();

  return useCallback(() => {
    const newPalette = [
      ...groups.flatMap((g) =>
        sortByColorSimilarity(palette.filter((c) => c.groupId === g.id))
      ),
      ...sortByColorSimilarity(
        palette.filter((c) => !c.groupId || !groups.find((g) => g.id === c.groupId))
      ),
    ];
    onReorderPalette(newPalette);
  }, [palette, groups, onReorderPalette]);
}
