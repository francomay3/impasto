import { jsPDF } from 'jspdf';
import type { ProjectState, Pigment } from '../types';
import { renderSwatches } from './pdfRenderers';

export function exportPdf(
  state: ProjectState,
  filteredCanvas: HTMLCanvasElement,
  indexedCanvas: HTMLCanvasElement,
  granularity: number,
  deltaThreshold: number,
  pigments: Pigment[],
  title: string = state.name
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 10;

  doc.setFontSize(18);
  doc.text(title, margin, 20);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 27);
  doc.setTextColor(0);

  const imgW = (pageW - margin * 3) / 2;
  const imgH = (imgW / filteredCanvas.width) * filteredCanvas.height;

  try {
    doc.addImage(filteredCanvas.toDataURL('image/jpeg', 0.8), 'JPEG', margin, 35, imgW, imgH);
    doc.setFontSize(8);
    doc.text('Filtered Original', margin, 35 + imgH + 4);
  } catch {
    /* skip if tainted */
  }

  try {
    doc.addImage(
      indexedCanvas.toDataURL('image/jpeg', 0.8),
      'JPEG',
      margin * 2 + imgW,
      35,
      imgW,
      imgH
    );
    doc.setFontSize(8);
    doc.text('Indexed Result', margin * 2 + imgW, 35 + imgH + 4);
  } catch {
    /* skip if tainted */
  }

  let y = 35 + imgH + 15;
  doc.setFontSize(12);
  doc.text('Color Palette', margin, y);
  y += 6;

  const groups = state.groups ?? [];

  if (groups.length === 0) {
    renderSwatches(doc, state.palette, y, margin, pageW, granularity, deltaThreshold, pigments);
    doc.save(`${title.replace(/\s+/g, '_')}_palette.pdf`);
    return;
  }

  for (const group of groups) {
    const groupColors = state.palette.filter((c) => c.groupId === group.id);
    if (groupColors.length === 0) continue;

    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(group.name, margin, y);
    doc.setDrawColor(80);
    doc.line(margin + doc.getTextWidth(group.name) + 2, y - 0.5, pageW - margin, y - 0.5);
    doc.setTextColor(0);
    y += 5;
    y = renderSwatches(doc, groupColors, y, margin, pageW, granularity, deltaThreshold, pigments);
    y += 6;
  }

  const ungrouped = state.palette.filter(
    (c) => !c.groupId || !groups.find((g) => g.id === c.groupId)
  );
  if (ungrouped.length > 0) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text('Ungrouped', margin, y);
    doc.setDrawColor(80);
    doc.line(margin + doc.getTextWidth('Ungrouped') + 2, y - 0.5, pageW - margin, y - 0.5);
    doc.setTextColor(0);
    y += 5;
    renderSwatches(doc, ungrouped, y, margin, pageW, granularity, deltaThreshold, pigments);
  }

  doc.save(`${title.replace(/\s+/g, '_')}_palette.pdf`);
}
