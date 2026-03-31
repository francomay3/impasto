import { createElement } from 'react';
import { pdf } from '@react-pdf/renderer';
import type { ProjectState, Pigment } from '../types';
import { PalettePdf } from './PalettePdf';

export async function exportPdf(
  state: ProjectState,
  filteredCanvas: HTMLCanvasElement,
  indexedCanvas: HTMLCanvasElement,
  minPaintPercent: number,
  deltaThreshold: number,
  pigments: Pigment[],
  title: string = state.name
): Promise<void> {
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
