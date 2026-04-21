import { createElement } from 'react';
import type { ProjectState, Pigment } from '../types';

export async function exportPdf(
  state: ProjectState,
  filteredCanvas: HTMLCanvasElement,
  indexedCanvas: HTMLCanvasElement,
  minPaintPercent: number,
  deltaThreshold: number,
  pigments: Pigment[],
  title: string = state.name
): Promise<void> {
  // Dynamic imports keep @react-pdf/renderer + PalettePdf out of the main bundle.
  // Both chunks load in parallel and are only fetched when the user triggers export.
  const [{ pdf }, { PalettePdf }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./PalettePdf'),
  ]);

  const filteredImageUrl = filteredCanvas.toDataURL('image/jpeg', 0.8);
  const indexedImageUrl = indexedCanvas.toDataURL('image/jpeg', 0.8);
  const date = new Date().toLocaleDateString();

  const blob = await pdf(
    createElement(PalettePdf, {
      title,
      date,
      palette: state.palette,
      groups: state.groups ?? [],
      filteredImageUrl,
      indexedImageUrl,
      minPaintPercent,
      deltaThreshold,
      pigments,
    })
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}_palette.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
